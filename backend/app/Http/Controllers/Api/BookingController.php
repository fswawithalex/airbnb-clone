<?php

namespace App\Http\Controllers\Api;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Enums\PropertyStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBookingRequest;
use App\Models\Booking;
use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Guest side of reservations: availability, booking, my trips, cancel, pay.
 * Host side lives in HostReservationController. Contract: docs/api-bookings.md
 */
class BookingController extends Controller
{
    /** Relations returned with every booking the guest sees. */
    private const GUEST_RELATIONS = ['property.primaryImage', 'property.host:id,name,first_name,avatar', 'payments'];

    /** Is the listing free for [check_in, check_out)? */
    public function availability(Request $request, Property $property)
    {
        $data = $request->validate([
            'check_in' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'check_out' => ['required', 'date_format:Y-m-d', 'after:check_in'],
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
            'available' => $available,
        ]);
    }

    /**
     * Ranges that are already taken from today on (pending/confirmed bookings + host blocks),
     * so the date picker can grey them out. Same semantics: start inclusive, end exclusive.
     */
    public function unavailableDates(Property $property)
    {
        $today = Carbon::today()->toDateString();

        $bookings = $property->bookings()
            ->whereIn('status', BookingStatus::blocksDates())
            ->where('check_out', '>', $today)
            ->get(['check_in', 'check_out'])
            ->map(fn (Booking $b) => ['start' => $b->check_in->toDateString(), 'end' => $b->check_out->toDateString()]);

        $blocked = $property->blockedDates()
            ->where('end_date', '>', $today)
            ->get(['start_date', 'end_date'])
            ->map(fn ($b) => [
                'start' => Carbon::parse($b->start_date)->toDateString(),
                'end' => Carbon::parse($b->end_date)->toDateString(),
            ]);

        return response()->json([
            'property_id' => $property->id,
            'ranges' => $bookings->concat($blocked)->sortBy('start')->values(),
        ]);
    }

    /**
     * My trips. ?scope=upcoming (default) | past | cancelled | all
     */
    public function index(Request $request)
    {
        $data = $request->validate([
            'scope' => ['sometimes', Rule::in(['upcoming', 'past', 'cancelled', 'all'])],
        ]);

        $bookings = Booking::query()
            ->where('guest_id', $request->user()->id)
            ->timeframe($data['scope'] ?? 'upcoming')
            ->with(self::GUEST_RELATIONS)
            ->orderBy('check_in', ($data['scope'] ?? 'upcoming') === 'upcoming' ? 'asc' : 'desc')
            ->paginate(12);

        return response()->json($bookings);
    }

    public function show(Request $request, Booking $booking)
    {
        abort_unless((int) $booking->guest_id === (int) $request->user()->id, 404);

        return response()->json($booking->load(self::GUEST_RELATIONS));
    }

    /**
     * Create a pending reservation. The property row is locked so concurrent
     * requests for the same listing cannot both pass the availability check.
     */
    public function store(StoreBookingRequest $request)
    {
        $data = $request->validated();
        $user = $request->user();

        $booking = DB::transaction(function () use ($data, $user) {
            $property = Property::query()
                ->whereKey($data['property_id'])
                ->lockForUpdate()
                ->firstOrFail();

            if ($property->status !== PropertyStatus::Published) {
                throw ValidationException::withMessages([
                    'property_id' => __('This listing is not available for booking.'),
                ]);
            }

            if ((int) $property->host_id === (int) $user->id) {
                throw ValidationException::withMessages([
                    'property_id' => __('You cannot book your own listing.'),
                ]);
            }

            if ((int) $data['guests'] > (int) $property->max_guests) {
                throw ValidationException::withMessages([
                    'guests' => __('This listing accommodates up to :count guests.', ['count' => $property->max_guests]),
                ]);
            }

            $available = Property::query()
                ->availableBetween($data['check_in'], $data['check_out'])
                ->whereKey($property->id)
                ->exists();

            if (! $available) {
                throw ValidationException::withMessages([
                    'check_in' => __('These dates are no longer available.'),
                ]);
            }

            $nights = (int) Carbon::parse($data['check_in'])->diffInDays(Carbon::parse($data['check_out']));

            // Calculate in cents to avoid floating-point currency arithmetic.
            $nightlyCents = (int) round(((float) $property->price_per_night) * 100);
            $totalPrice = number_format($nightlyCents * $nights / 100, 2, '.', '');

            $booking = $property->bookings()->create([
                'guest_id' => $user->id,
                'check_in' => $data['check_in'],
                'check_out' => $data['check_out'],
                'guests' => $data['guests'],
                'price_per_night' => number_format($nightlyCents / 100, 2, '.', ''),
                'total_price' => $totalPrice,
                'status' => BookingStatus::Pending,
            ]);

            $booking->payments()->create([
                'amount' => $totalPrice,
                'currency' => 'EUR',
                'status' => PaymentStatus::Pending,
            ]);

            return $booking;
        });

        return response()->json([
            'message' => __('Reservation request sent to the host.'),
            'booking' => $booking->load(self::GUEST_RELATIONS),
        ], 201);
    }

    /** The guest cancels a pending or confirmed stay before check-in. A paid payment is refunded. */
    public function cancel(Request $request, Booking $booking)
    {
        abort_unless((int) $booking->guest_id === (int) $request->user()->id, 404);

        $booking = DB::transaction(function () use ($booking) {
            $booking = Booking::query()->whereKey($booking->id)->lockForUpdate()->firstOrFail();

            if (! $booking->isCancellable()) {
                throw ValidationException::withMessages([
                    'booking' => __('This reservation can no longer be cancelled.'),
                ]);
            }

            $booking->update(['status' => BookingStatus::Cancelled]);
            $booking->settlePaymentsAfterCancellation();

            return $booking;
        });

        return response()->json([
            'message' => __('Reservation cancelled.'),
            'booking' => $booking->fresh(self::GUEST_RELATIONS),
        ]);
    }

    /** Mock checkout: only once the host has confirmed the reservation. */
    public function pay(Request $request, Booking $booking)
    {
        abort_unless((int) $booking->guest_id === (int) $request->user()->id, 404);

        $booking = DB::transaction(function () use ($booking) {
            $booking = Booking::query()->whereKey($booking->id)->lockForUpdate()->firstOrFail();

            if ($booking->status !== BookingStatus::Confirmed) {
                throw ValidationException::withMessages([
                    'booking' => __('You can pay once the host confirms your reservation.'),
                ]);
            }

            if ($booking->isPaid()) {
                throw ValidationException::withMessages([
                    'booking' => __('This reservation is already paid.'),
                ]);
            }

            $payment = $booking->payments()->where('status', PaymentStatus::Pending)->latest('id')->first()
                ?? $booking->payments()->make(['amount' => $booking->total_price, 'currency' => 'EUR']);

            $payment->fill([
                'provider' => 'mock',
                'transaction_id' => 'mock_'.Str::uuid(),
                'status' => PaymentStatus::Paid,
            ])->save();

            return $booking;
        });

        return response()->json([
            'message' => __('Payment successful.'),
            'booking' => $booking->fresh(self::GUEST_RELATIONS),
        ]);
    }
}
