<?php

namespace Database\Factories;

use App\Enums\PropertyStatus;
use App\Enums\ServiceCategory;
use App\Models\Service;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Service>
 */
class ServiceFactory extends Factory
{
    /** Title ideas per category; " in {city}" is added. */
    private const TITLES = [
        'chef' => ['Private chef dinner', 'Brunch cooked at your place', 'Traditional dinner by a home cook'],
        'photography' => ['Holiday photo shoot', 'Couple photo session', 'Family portraits in the old town'],
        'massage' => ['Relaxing massage at your place', 'Sports massage', 'Hot stone massage'],
        'training' => ['Personal training session', 'Morning run with a coach', 'Pilates at your place'],
        'makeup' => ['Makeup for a night out', 'Hair and makeup styling', 'Wedding guest makeup'],
    ];

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $category = fake()->randomElement(ServiceCategory::cases());
        [$country, $city] = fake()->randomElement(PropertyFactory::CITIES);

        return [
            'host_id' => User::factory()->host(),
            'title' => fake()->randomElement(self::TITLES[$category->value]).' in '.$city,
            'description' => fake()->paragraphs(2, true),
            'category' => $category,
            'country' => $country,
            'city' => $city,
            'price' => fake()->numberBetween(40, 200),
            'duration_minutes' => fake()->randomElement([60, 90, 120, 180]),
            'max_guests' => fake()->numberBetween(1, 8),
            'image_url' => null,
            'status' => PropertyStatus::Published,
        ];
    }

    public function draft(): static
    {
        return $this->state(fn () => ['status' => PropertyStatus::Draft]);
    }
}
