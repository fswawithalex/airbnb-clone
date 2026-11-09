<?php

namespace Database\Factories;

use App\Models\Conversation;
use App\Models\Property;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * host_id is copied from the property.
 *
 * @extends Factory<Conversation>
 */
class ConversationFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'property_id' => Property::factory(),
            'guest_id' => User::factory(),
            'host_id' => fn (array $attributes) => Property::find($attributes['property_id'])->host_id,
        ];
    }
}
