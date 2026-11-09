<?php

namespace Database\Factories;

use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Sender defaults to the conversation's guest.
 *
 * @extends Factory<Message>
 */
class MessageFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'conversation_id' => Conversation::factory(),
            'sender_id' => fn (array $attributes) => Conversation::find($attributes['conversation_id'])->guest_id,
            'body' => fake()->sentence(fake()->numberBetween(6, 20)),
            'read_at' => null,
        ];
    }
}
