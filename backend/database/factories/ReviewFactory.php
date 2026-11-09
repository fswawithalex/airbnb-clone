<?php

namespace Database\Factories;

use App\Models\Booking;
use App\Models\Review;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * guest_id/property_id are copied from the booking, like the real app must do.
 *
 * @extends Factory<Review>
 */
class ReviewFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'booking_id' => Booking::factory()->completed(),
            'guest_id' => fn (array $attributes) => Booking::find($attributes['booking_id'])->guest_id,
            'property_id' => fn (array $attributes) => Booking::find($attributes['booking_id'])->property_id,
            'rating' => fake()->randomElement([3, 4, 4, 5, 5, 5]),
            'comment' => fake()->optional(0.85)->paragraph(),
        ];
    }
}
