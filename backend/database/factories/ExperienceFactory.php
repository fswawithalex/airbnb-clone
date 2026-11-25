<?php

namespace Database\Factories;

use App\Enums\ExperienceCategory;
use App\Enums\PropertyStatus;
use App\Models\Experience;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Experience>
 */
class ExperienceFactory extends Factory
{
    /** Title ideas per category; " in {city}" is added. */
    private const TITLES = [
        'food' => ['Pasta-making class with a local cook', 'Street food tasting walk', 'Wine tasting in an old cellar'],
        'tours' => ['Old town walking tour', 'Hidden courtyards by bike', 'Sunset tour of the city'],
        'art' => ['Pottery workshop', 'Watercolour sketching walk', 'Street art tour'],
        'outdoors' => ['Hike to the best viewpoint', 'Kayaking at sunrise', 'Day trip to the mountains'],
        'wellness' => ['Sunrise yoga in the park', 'Forest bathing walk', 'Breathwork and meditation session'],
    ];

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $category = fake()->randomElement(ExperienceCategory::cases());
        [$country, $city] = fake()->randomElement(PropertyFactory::CITIES);

        return [
            'host_id' => User::factory()->host(),
            'title' => fake()->randomElement(self::TITLES[$category->value]).' in '.$city,
            'description' => fake()->paragraphs(2, true),
            'category' => $category,
            'country' => $country,
            'city' => $city,
            'price' => fake()->numberBetween(20, 120),
            'duration_minutes' => fake()->randomElement([90, 120, 150, 180, 240]),
            'max_guests' => fake()->numberBetween(4, 12),
            'image_url' => null,
            'status' => PropertyStatus::Published,
        ];
    }

    public function draft(): static
    {
        return $this->state(fn () => ['status' => PropertyStatus::Draft]);
    }
}
