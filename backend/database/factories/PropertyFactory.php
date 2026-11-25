<?php

namespace Database\Factories;

use App\Enums\PropertyStatus;
use App\Enums\PropertyType;
use App\Models\Property;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Property>
 */
class PropertyFactory extends Factory
{
    /** [country, city, latitude, longitude] — coordinates are jittered around the city centre. Also used by the experience/service factories. */
    public const CITIES = [
        ['Romania', 'Bucharest', 44.4268, 26.1025],
        ['Romania', 'Cluj-Napoca', 46.7712, 23.6236],
        ['Romania', 'Brasov', 45.6427, 25.5887],
        ['Italy', 'Rome', 41.9028, 12.4964],
        ['Spain', 'Barcelona', 41.3874, 2.1686],
        ['France', 'Paris', 48.8566, 2.3522],
        ['Portugal', 'Lisbon', 38.7223, -9.1393],
        ['Greece', 'Athens', 37.9838, 23.7275],
    ];

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        [$country, $city, $lat, $lng] = fake()->randomElement(self::CITIES);
        // Homes only; hotels come from the hotel() state
        $type = fake()->randomElement(array_values(array_filter(PropertyType::cases(), fn (PropertyType $type) => $type !== PropertyType::Hotel)));
        $bedrooms = $type === PropertyType::Studio || $type === PropertyType::Room ? 1 : fake()->numberBetween(1, 4);

        return [
            'host_id' => User::factory()->host(),
            'title' => fake()->randomElement(['Cozy', 'Bright', 'Modern', 'Charming', 'Spacious', 'Quiet', 'Stylish'])
                .' '.strtolower($type->label()).' in '.$city,
            'description' => fake()->paragraphs(3, true),
            'property_type' => $type,
            'country' => $country,
            'city' => $city,
            'address' => fake()->streetAddress(),
            'latitude' => round($lat + fake()->randomFloat(4, -0.04, 0.04), 7),
            'longitude' => round($lng + fake()->randomFloat(4, -0.04, 0.04), 7),
            'price_per_night' => fake()->numberBetween(35, 300),
            'max_guests' => $bedrooms * 2,
            'bedrooms' => $bedrooms,
            'beds' => $bedrooms + fake()->numberBetween(0, 1),
            'bathrooms' => fake()->randomElement([1, 1, 1.5, 2, 2.5]),
            'pets_allowed' => fake()->boolean(40),
            'status' => PropertyStatus::Published,
        ];
    }

    public function draft(): static
    {
        return $this->state(fn () => ['status' => PropertyStatus::Draft]);
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['status' => PropertyStatus::Inactive]);
    }

    /** A hotel room: "Grand hotel in Rome", 2 guests. */
    public function hotel(): static
    {
        return $this->state(fn (array $attributes) => [
            'property_type' => PropertyType::Hotel,
            'title' => fake()->randomElement(['Grand', 'Boutique', 'Central', 'Riverside', 'Old Town', 'Park'])
                .' hotel in '.$attributes['city'],
            'price_per_night' => fake()->numberBetween(60, 250),
            'max_guests' => 2,
            'bedrooms' => 1,
            'beds' => fake()->numberBetween(1, 2),
            'bathrooms' => 1,
            'pets_allowed' => false,
        ]);
    }
}
