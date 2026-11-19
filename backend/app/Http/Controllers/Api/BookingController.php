<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Enums\PropertyStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBookingRequest;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class BookingController extends Controller
{
    /** Check whether a listing is available for a requested date range. */
    public function availability(Request $request, Property $property)
    {
        $data = $request->validate([
            'check_in' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'check_out' => ['required', 'date_format:Y-m-d', 'after:check_in']
        ]);

        $available = $property->status === PropertyStatus::Published
            && Property::query()
                ->availableBetween($data['check_in'], $data['check_out'])
                ->whereKey($property->id)
                ->exists();

        return response()->json([
            'property_id' => $property->id,
            'check_in' => $data['check_in'],
            'check_out' => $data['check_out'],
            'available' => $available
        ]);
    }

    /**
     * Create a pending reservation. The property row is locked so concurrent
     * requests for the same listing cannot both pass the availability check.
     */
    public function store(StoreBookingRequest $request)
    {
        $data = $request->validated();

        $booking = DB::transaction(function () use ($data, $request) {
            $property = Property::query()
                ->whereKey($data['property_id'])
                ->lockForUpdate()
                ->firstOrFail();

            if ($property->status !== PropertyStatus::Published) {
                throw ValidationException::withMessages([
                    'property_id' => 'BE.ERROR_BOOKING_PROPERTY_NOT_AVAILABLE',
                ]);
            }

            if ((int) $property->host_id === (int) $request->user()->id) {
                throw ValidationException::withMessages([
                    'property_id' => 'BE.ERROR_BOOKING_HOST_NOT_BOOK_OWN_PROPERTY'
                ]);
            }

            if ((int) $data['guests'] > (int) $property->max_guests) {
                throw ValidationException::withMessages([
                    'guests' => "This property can accommodates up to {$property->max_guests} guests. "
                ]);
            }

            $available = Property::query()
                ->availableBetween($data['check_in'], $data['check_out'])
                ->whereKey($property->id)
                ->exists();

            if (!$available) {
                throw ValidationException::withMessages([
                    'dates' => 'BE.ERROR_BOOKING_PROPERTY_NOT_AVAILABLE_FOR_DATES'
                ]);
            }

            $checkIn = \Illuminate\Support\Carbon::parse($data['check_in']);
            $checkOut = \Illuminate\Support\Carbon::parse($data['check_out']);
            $nights = (int) $checkIn->diffInDays($checkOut);

            // Calculate in cents to avoid floating-point currency arithmetic.
            $nightlyCents = (int) round(((float) $property->price_per_night) * 100);
            $totalCents = $nightlyCents * $nights;
            $nightlyPrice = number_format($nightlyCents / 100, 2, '.', '');
            $totalPrice = number_format($totalCents / 100, 2, '.', '');

            $booking = Booking::create([
                'property_id' => $property->id,
                'guest_id' => $request->user()->id,
                'check_in' => $data['check_in'],
                'check_out' => $data['check_out'],
                'guests' => $data['guests'],
                'price_per_night' => $nightlyPrice,
                'total_price' => $totalPrice,
                'status' => BookingStatus::Pending
            ]);

            $booking->payments()->create([
                'amount' => $totalPrice,
                'currency' => 'EUR',
                'status' => PaymentStatus::Pending
            ]);

            return $booking;
        });

        return response()->json([
            'message' => 'Reservation request created. ',
            'booking' => $booking->load(['property.primaryImage', 'payments'])
        ], 201);
    }

    // FUNCTIONS for GUESTs
    public function index(Request $request)
    {
        abort_unless($request->user(), 401);

        $bookings = Booking::query()
            ->where('guest_id', $request->user()->id)
            ->with(['property.primaryImage', 'payments'])
            ->latest()
            ->paginate(16);

        return response()->json($bookings);
    }

    public function cancel(Request $request, Booking $booking)
    {
        abort_unless($request->user(), 401);

        $cancelledBooking = DB::transaction(function () use ($booking, $request) {
            $booking = Booking::query()
                ->whereKey($booking->id)
                ->where('guest_id', $request->user()->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($booking->status !== BookingStatus::Confirmed) {
                throw ValidationException::withMessages([
                    'booking' => 'BE.ERROR_BOOKING_STATUS_NOT_FOR_CANCELATION'
                ]);
            }

            $booking->update([
                'status' => BookingStatus::Cancelled
            ]);

            return $booking->fresh([
                'property.primaryImage'
            ]);
        });

        return response()->json([
            'message' => 'Booking cancelled',
            'booking' => $cancelledBooking
        ]);
    }

    // FUNCTIONS for HOSTs
    public function show(Request $request)
    {
        abort_unless($request->user(), 401);

        $bookings = Booking::query()
            ->where('host_id', $request->user()->id)
            ->with(['property.primaryImage', 'payments'])
            ->latest()
            ->paginate(16);

        return response()->json($bookings);
    }

    public function approve(Request $request, Booking $booking)
    {
        abort_unless($request->user(), 401);

        $confirmedBooking = DB::transaction(function () use ($request, $booking){
            // Lock the property first. This serializes approval attempts
            // for bookings belonging to the same property.
            $property = Property::query()
            ->whereKey($booking->property_id)
            ->lockForUpdate()
            ->firstOrFail();

            abort_unless(
                (int) $property->host_id === (int) $request->user()->id,
                403,
                'BE.ERROR_BOOKING_NOT_HOST'
            );

            $booking = Booking::query()
                ->whereKey($booking->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($booking->status !== BookingStatus::Pending) {
                throw ValidationException::withMessages([
                    'booking' => 'BE.ERROR_BOOKING_NOT_PENDING_STATUS'
                ]);
            }

            $available = Property::query()
                ->availableBetween(
                    $booking->check_in,
                    $booking->check_out,
                    $booking->id
                )
                ->whereKey($property->id)
                ->exists();

            if (!$available) {
                throw ValidationException::withMessages([
                    'dates' => 'BE.ERROR_BOOKING_DATES_NOT_AVAILABLE'
                ]);
            }

            $booking->update([
                'status' => BookingStatus::Confirmed
            ]);

            return $booking->fresh([
                'property.primaryImage',
                'payments'
            ]);
        });

        return response()->json([
            'message' => 'Booking approved',
            'booking' => $confirmedBooking
        ]);
    }

    public function reject(Request $request, Booking $booking) {
        abort_unless($request->user(), 401);

        $rejectedBooking = DB::transaction(function () use ($request, $booking) {
            $property = Property::query()
                ->whereKey($booking->property_id)
                ->lockForUpdate()
                ->firstOrFail();

            abort_unless(
                (int) $property->host_id === (int) $request->user()->id,
                403,
                'BE.ERROR_BOOKING_NOT_HOST'
            );

            $booking = Booking::query()
                ->whereKey($booking->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($booking->status !== BookingStatus::Pending) {
                throw ValidationException::withMessages([
                    'booking' => 'BE.ERROR_BOOKING_NOT_PENDING'
                ]);
            }

            $booking->update([
                'status' => BookingStatus::Rejected
            ]);

            return $booking->fresh([
                'property.primaryImage',
                'payments'
            ]);
        });

        return response()->json([
            'message' => 'Booking rejected',
            'booking' => $rejectedBooking
        ]);
    }
}
