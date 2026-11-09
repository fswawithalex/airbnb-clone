<?php

namespace Database\Factories;

use App\Models\Property;
use App\Models\PropertyBlockedDate;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<PropertyBlockedDate>
 */
class PropertyBlockedDateFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $start = Carbon::instance(fake()->dateTimeBetween('+2 months', '+3 months'))->startOfDay();

        return [
            'property_id' => Property::factory(),
            'start_date' => $start,
            'end_date' => $start->copy()->addDays(fake()->numberBetween(1, 5)),
            'reason' => fake()->optional()->randomElement(['Maintenance', 'Personal use', 'Renovation']),
        ];
    }
}
