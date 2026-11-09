<?php

namespace Database\Factories;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Property;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * Prices are derived from the property (keep property_id first: closures see attributes resolved before them).
 *
 * @extends Factory<Booking>
 */
class BookingFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $checkIn = Carbon::instance(fake()->dateTimeBetween('+1 week', '+2 months'))->startOfDay();

        return [
            'property_id' => Property::factory(),
            'guest_id' => User::factory(),
            'check_in' => $checkIn,
            'check_out' => $checkIn->copy()->addDays(fake()->numberBetween(2, 7)),
            'guests' => 1,
            'price_per_night' => fn (array $attributes) => Property::find($attributes['property_id'])->price_per_night,
            'total_price' => fn (array $attributes) => round(
                $attributes['price_per_night'] * Carbon::parse($attributes['check_in'])->diffInDays(Carbon::parse($attributes['check_out'])),
                2,
            ),
            'status' => BookingStatus::Confirmed,
        ];
    }

    /** Stay between the given dates (check_out exclusive). */
    public function between(Carbon|string $checkIn, Carbon|string $checkOut): static
    {
        return $this->state(fn () => [
            'check_in' => Carbon::parse($checkIn)->startOfDay(),
            'check_out' => Carbon::parse($checkOut)->startOfDay(),
        ]);
    }

    public function pending(): static
    {
        return $this->state(fn () => ['status' => BookingStatus::Pending]);
    }

    public function cancelled(): static
    {
        return $this->state(fn () => ['status' => BookingStatus::Cancelled]);
    }

    public function completed(): static
    {
        return $this->state(function () {
            $checkIn = Carbon::instance(fake()->dateTimeBetween('-6 months', '-2 weeks'))->startOfDay();

            return [
                'check_in' => $checkIn,
                'check_out' => $checkIn->copy()->addDays(fake()->numberBetween(2, 6)),
                'status' => BookingStatus::Completed,
            ];
        });
    }
}
