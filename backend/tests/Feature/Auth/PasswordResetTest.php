<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_reset_link_points_to_the_react_app(): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'ana@example.com']);

        $this->postJson('/api/auth/forgot-password', ['email' => 'ana@example.com'])->assertOk();

        Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use ($user) {
            $url = $notification->toMail($user)->actionUrl;

            return str_starts_with($url, config('app.frontend_url').'/reset-password?token=')
                && str_contains($url, 'email=ana%40example.com');
        });
    }

    public function test_unknown_email_gets_the_same_answer(): void
    {
        Notification::fake();

        $known = User::factory()->create(['email' => 'ana@example.com']);
        $knownMessage = $this->postJson('/api/auth/forgot-password', ['email' => 'ana@example.com'])->json('message');

        $this->postJson('/api/auth/forgot-password', ['email' => 'nobody@example.com'])
            ->assertOk()
            ->assertJsonPath('message', $knownMessage);

        Notification::assertSentToTimes($known, ResetPassword::class, 1);
    }

    public function test_password_can_be_reset_with_the_emailed_token(): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'ana@example.com']);
        $user->createToken('old-device');

        $this->postJson('/api/auth/forgot-password', ['email' => 'ana@example.com']);

        $token = null;
        Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use (&$token) {
            $token = $notification->token;

            return true;
        });

        $this->postJson('/api/auth/reset-password', [
            'token' => $token,
            'email' => 'ana@example.com',
            'password' => 'newpass123',
            'password_confirmation' => 'newpass123',
        ])->assertOk();

        $this->assertTrue(Hash::check('newpass123', $user->refresh()->password));
        $this->assertSame(0, $user->tokens()->count());
    }

    public function test_invalid_token_is_rejected(): void
    {
        User::factory()->create(['email' => 'ana@example.com']);

        $this->postJson('/api/auth/reset-password', [
            'token' => 'not-a-real-token',
            'email' => 'ana@example.com',
            'password' => 'newpass123',
            'password_confirmation' => 'newpass123',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');
    }
}
