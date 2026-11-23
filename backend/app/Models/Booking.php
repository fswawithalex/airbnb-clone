<?php

namespace App\Models;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use Database\Factories\BookingFactory;
use Illuminate\Database\Eloquent\Attributes\Appends;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/** check_in inclusive, check_out exclusive. */
#[Fillable(['property_id', 'guest_id', 'check_in', 'check_out', 'guests', 'price_per_night', 'total_price', 'status'])]
#[Appends(['nights'])]
class Booking extends Model
{
    /** @use HasFactory<BookingFactory> */
    use HasFactory;

    protected $attributes = [
        'status' => 'pending',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            // Serialized as plain "2027-03-10" so the frontend never shifts days because of time zones
            'check_in' => 'date:Y-m-d',
            'check_out' => 'date:Y-m-d',
            'guests' => 'integer',
            'price_per_night' => 'decimal:2',
            'total_price' => 'decimal:2',
            'status' => BookingStatus::class,
        ];
    }

    public function property(): BelongsTo
    {
        // Keep showing old trips even if the host deleted (soft-deleted) the listing
        return $this->belongsTo(Property::class)->withTrashed();
    }

    public function guest(): BelongsTo
    {
        return $this->belongsTo(User::class, 'guest_id')->withTrashed();
    }

    public function review(): HasOne
    {
        return $this->hasOne(Review::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class)->latest('id');
    }

    /** Computed from the dates (not stored). */
    protected function nights(): Attribute
    {
        return Attribute::get(fn () => $this->check_in && $this->check_out
            ? (int) $this->check_in->diffInDays($this->check_out)
            : null);
    }

    /**
     * Group bookings for the Trips / Reservations tabs:
     *  upcoming  = pending or confirmed, stay not over yet
     *  past      = completed, or confirmed and already checked out
     *  cancelled = cancelled or rejected
     *  all       = no filter
     */
    #[Scope]
    protected function timeframe(Builder $query, string $timeframe): void
    {
        $today = Carbon::today()->toDateString();

        match ($timeframe) {
            'upcoming' => $query
                ->whereIn('status', BookingStatus::blocksDates())
                ->where('check_out', '>', $today),
            'past' => $query->where(fn (Builder $q) => $q
                ->where('status', BookingStatus::Completed)
                ->orWhere(fn (Builder $q) => $q
                    ->where('status', BookingStatus::Confirmed)
                    ->where('check_out', '<=', $today))),
            'cancelled' => $query->whereIn('status', [BookingStatus::Cancelled, BookingStatus::Rejected]),
            default => null,
        };
    }

    /** Pending/confirmed stays can be cancelled until the check-in day. */
    public function isCancellable(): bool
    {
        return in_array($this->status, BookingStatus::blocksDates(), true)
            && $this->check_in->isAfter(Carbon::today());
    }

    public function isPaid(): bool
    {
        return $this->payments()->where('status', PaymentStatus::Paid)->exists();
    }

    /** After a cancel/reject: refund what was paid, close what was never paid. */
    public function settlePaymentsAfterCancellation(): void
    {
        $this->payments()->where('status', PaymentStatus::Paid)->update(['status' => PaymentStatus::Refunded]);
        $this->payments()->where('status', PaymentStatus::Pending)->update(['status' => PaymentStatus::Failed]);
    }
}
