<?php

namespace App\Http\Controllers\Api;

use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Host side of reservations: requests on my listings, approve / reject / cancel.
 * Contract: docs/api-bookings.md
 */
class HostReservationController extends Controller
{
    private const HOST_RELATIONS = ['property.primaryImage', 'guest:id,name,first_name,avatar,created_at', 'payments'];

    /**
     * Reservations on the listings I host.
     * ?scope=pending (default) | upcoming | past | cancelled | all, optional ?property_id=
     */
    public function index(Request $request)
    {
        $data = $request->validate([
            'scope' => ['sometimes', Rule::in(['pending', 'upcoming', 'past', 'cancelled', 'all'])],
            'property_id' => ['sometimes', 'integer'],
        ]);
        $scope = $data['scope'] ?? 'pending';

        $query = Booking::query()
            ->whereHas('property', fn ($q) => $q->where('host_id', $request->user()->id))
            ->when(isset($data['property_id']), fn ($q) => $q->where('property_id', $data['property_id']))
            ->with(self::HOST_RELATIONS);

        if ($scope === 'pending') {
            $query->where('status', BookingStatus::Pending)->orderBy('created_at');
        } else {
            $query->timeframe($scope)->orderBy('check_in', $scope === 'upcoming' ? 'asc' : 'desc');
        }

        // Counts for the tab badges
        $pendingCount = Booking::query()
            ->whereHas('property', fn ($q) => $q->where('host_id', $request->user()->id))
            ->where('status', BookingStatus::Pending)
            ->count();

        return response()->json([...$query->paginate(12)->toArray(), 'pending_count' => $pendingCount]);
    }

    public function approve(Request $request, Booking $booking)
    {
        $booking = $this->transition($request, $booking, function (Booking $booking, Property $property) {
            if ($booking->status !== BookingStatus::Pending) {
                throw ValidationException::withMessages(['booking' => __('Only pending requests can be accepted.')]);
            }

            // Another request for the same dates may have been accepted in the meantime
            $available = Property::query()
                ->availableBetween($booking->check_in, $booking->check_out, $booking->id)
                ->whereKey($property->id)
                ->exists();

            if (! $available) {
                throw ValidationException::withMessages(['booking' => __('These dates are no longer available.')]);
            }

            $booking->update(['status' => BookingStatus::Confirmed]);
        });

        return response()->json(['message' => __('Reservation accepted.'), 'booking' => $booking]);
    }

    public function reject(Request $request, Booking $booking)
    {
        $booking = $this->transition($request, $booking, function (Booking $booking) {
            if ($booking->status !== BookingStatus::Pending) {
                throw ValidationException::withMessages(['booking' => __('Only pending requests can be declined.')]);
            }

            $booking->update(['status' => BookingStatus::Rejected]);
            $booking->settlePaymentsAfterCancellation();
        });

        return response()->json(['message' => __('Reservation declined.'), 'booking' => $booking]);
    }

    /** The host cancels an accepted stay before check-in (the guest gets a refund). */
    public function cancel(Request $request, Booking $booking)
    {
        $booking = $this->transition($request, $booking, function (Booking $booking) {
            if ($booking->status !== BookingStatus::Confirmed || ! $booking->isCancellable()) {
                throw ValidationException::withMessages(['booking' => __('This reservation can no longer be cancelled.')]);
            }

            $booking->update(['status' => BookingStatus::Cancelled]);
            $booking->settlePaymentsAfterCancellation();
        });

        return response()->json(['message' => __('Reservation cancelled.'), 'booking' => $booking]);
    }

    /**
     * Lock the property first (serializes approvals for the same listing), check ownership,
     * lock the booking, then run the status change.
     */
    private function transition(Request $request, Booking $booking, callable $change): Booking
    {
        return DB::transaction(function () use ($request, $booking, $change) {
            $property = Property::withTrashed()->whereKey($booking->property_id)->lockForUpdate()->firstOrFail();

            // 404 instead of 403: don't reveal other hosts' reservations
            abort_unless((int) $property->host_id === (int) $request->user()->id, 404);

            $booking = Booking::query()->whereKey($booking->id)->lockForUpdate()->firstOrFail();
            $change($booking, $property);

            return $booking->fresh(self::HOST_RELATIONS);
        });
    }
}
