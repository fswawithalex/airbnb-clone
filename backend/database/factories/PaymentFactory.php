<?php

namespace Database\Factories;

use App\Enums\PaymentStatus;
use App\Models\Booking;
use App\Models\Payment;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'booking_id' => Booking::factory(),
            'amount' => fn (array $attributes) => Booking::find($attributes['booking_id'])->total_price,
            'currency' => 'EUR',
            'provider' => 'mock',
            'transaction_id' => 'mock_'.Str::lower(Str::random(20)),
            'status' => PaymentStatus::Paid,
        ];
    }

    public function failed(): static
    {
        return $this->state(fn () => ['status' => PaymentStatus::Failed]);
    }
}
