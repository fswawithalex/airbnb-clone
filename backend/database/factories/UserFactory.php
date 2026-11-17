<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $firstName = fake()->firstName();
        $lastName = fake()->lastName();

        return [
            'name' => "$firstName $lastName",
            'first_name' => $firstName,
            'last_name' => $lastName,
            'birth_date' => fake()->dateTimeBetween('-70 years', '-18 years')->format('Y-m-d'),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'phone' => fake()->optional(0.7)->e164PhoneNumber(),
            'avatar' => null,
            'role' => UserRole::Guest,
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Keep first/last name in sync when a test or seeder passes only 'name' (e.g. 'Demo Host').
     */
    public function configure(): static
    {
        return $this->afterMaking(function (User $user) {
            if ($user->name !== trim($user->first_name.' '.$user->last_name)) {
                [$first, $last] = array_pad(preg_split('/\s+/', trim($user->name), 2), 2, null);
                $user->first_name = $first;
                $user->last_name = $last;
            }
        });
    }

    public function host(): static
    {
        return $this->state(fn () => ['role' => UserRole::Host]);
    }

    public function admin(): static
    {
        return $this->state(fn () => ['role' => UserRole::Admin]);
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
