<?php

namespace App\Models;

use App\Enums\BookingStatus;
use App\Enums\PropertyStatus;
use App\Enums\PropertyType;
use Database\Factories\PropertyFactory;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

// host_id is not fillable: create listings through the relation, e.g. $user->properties()->create($data)
#[Fillable([
    'title', 'description', 'property_type', 'country', 'city', 'address', 'latitude', 'longitude',
    'price_per_night', 'max_guests', 'bedrooms', 'beds', 'bathrooms', 'status',
])]
class Property extends Model
{
    /** @use HasFactory<PropertyFactory> */
    use HasFactory, SoftDeletes;

    protected $attributes = [
        'status' => 'draft',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'property_type' => PropertyType::class,
            'status' => PropertyStatus::class,
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'price_per_night' => 'decimal:2',
            'bathrooms' => 'decimal:1',
            'max_guests' => 'integer',
            'bedrooms' => 'integer',
            'beds' => 'integer',
        ];
    }

    public function host(): BelongsTo
    {
        return $this->belongsTo(User::class, 'host_id');
    }

    public function images(): HasMany
    {
        return $this->hasMany(PropertyImage::class)->orderBy('sort_order');
    }

    public function primaryImage(): HasOne
    {
        return $this->hasOne(PropertyImage::class)->where('is_primary', true);
    }

    public function amenities(): BelongsToMany
    {
        return $this->belongsToMany(Amenity::class);
    }

    public function blockedDates(): HasMany
    {
        return $this->hasMany(PropertyBlockedDate::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    /** Users who saved this listing to their wishlist. */
    public function favoritedBy(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'favorites')->withTimestamps();
    }

    public function conversations(): HasMany
    {
        return $this->hasMany(Conversation::class);
    }

    #[Scope]
    protected function published(Builder $query): void
    {
        $query->where('status', PropertyStatus::Published);
    }

    /**
     * Listings free for the whole stay [checkIn, checkOut): no pending/confirmed booking
     * and no host-blocked range overlaps it. Two ranges overlap when
     * existing.start < new.end AND existing.end > new.start.
     *
     * Note: for creating a booking, re-check inside a DB transaction with lockForUpdate()
     * on the property row, otherwise two requests can book the same dates at once.
     */
    #[Scope]
    protected function availableBetween(Builder $query, DateTimeInterface|string $checkIn, DateTimeInterface|string $checkOut): void
    {
        // Compare plain dates: a time-of-day would make "check-out day = next check-in day" look like an overlap.
        $checkIn = Carbon::parse($checkIn)->toDateString();
        $checkOut = Carbon::parse($checkOut)->toDateString();

        $query
            ->whereDoesntHave('bookings', fn (Builder $q) => $q
                ->whereIn('status', BookingStatus::blocksDates())
                ->where('check_in', '<', $checkOut)
                ->where('check_out', '>', $checkIn))
            ->whereDoesntHave('blockedDates', fn (Builder $q) => $q
                ->where('start_date', '<', $checkOut)
                ->where('end_date', '>', $checkIn));
    }
}
