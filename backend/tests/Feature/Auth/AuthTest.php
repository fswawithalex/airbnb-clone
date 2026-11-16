<?php

namespace Tests\Feature\Auth;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_and_gets_a_token(): void
    {
        $response = $this->postJson('/api/auth/register', $this->signup([
            'email' => 'Ana@Example.com',
            'phone' => '+40700000000',
        ]));

        $response->assertCreated()
            ->assertJsonPath('user.email', 'ana@example.com')
            ->assertJsonPath('user.first_name', 'Ana')
            ->assertJsonPath('user.last_name', 'Pop')
            ->assertJsonPath('user.birth_date', '1995-04-12')
            ->assertJsonPath('user.role', 'guest')
            ->assertJsonMissingPath('user.password')
            ->assertJsonStructure(['token']);

        $this->getJson('/api/user', ['Authorization' => 'Bearer '.$response->json('token')])
            ->assertOk()
            ->assertJsonPath('data.name', 'Ana Pop'); // users.name is kept as "first last"
    }

    public function test_register_ignores_a_role_sent_by_the_client(): void
    {
        $this->postJson('/api/auth/register', $this->signup([
            'email' => 'hacker@example.com',
            'role' => 'admin',
        ]))->assertCreated()->assertJsonPath('user.role', 'guest');

        $this->assertSame(UserRole::Guest, User::firstWhere('email', 'hacker@example.com')->role);
    }

    public function test_register_validates_input(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);

        $this->postJson('/api/auth/register', [
            'first_name' => '',
            'email' => 'taken@example.com',
            'password' => 'short',
        ])->assertUnprocessable()->assertJsonValidationErrors(['first_name', 'last_name', 'birth_date', 'email', 'password']);
    }

    public function test_you_must_be_18_to_sign_up(): void
    {
        $this->postJson('/api/auth/register', $this->signup([
            'birth_date' => now()->subYears(18)->addDay()->toDateString(),
        ]))->assertUnprocessable()
            ->assertJsonPath('errors.birth_date.0', 'You need to be at least 18 to sign up.');

        $this->postJson('/api/auth/register', $this->signup([
            'birth_date' => now()->subYears(18)->toDateString(),
        ]))->assertCreated();
    }

    public function test_check_email_tells_login_from_signup(): void
    {
        User::factory()->create(['email' => 'ana@example.com']);

        $this->postJson('/api/auth/check-email', ['email' => ' ANA@example.com '])->assertOk()->assertExactJson(['exists' => true]);
        $this->postJson('/api/auth/check-email', ['email' => 'new@example.com'])->assertOk()->assertExactJson(['exists' => false]);
        $this->postJson('/api/auth/check-email', ['email' => 'not-an-email'])->assertUnprocessable();
    }

    public function test_messages_follow_accept_language(): void
    {
        $this->postJson('/api/auth/login', ['email' => 'x@example.com', 'password' => 'nope'], ['Accept-Language' => 'ro'])
            ->assertJsonPath('errors.email.0', 'Datele de autentificare nu se potrivesc cu înregistrările noastre.');

        $this->postJson('/api/auth/register', [], ['Accept-Language' => 'ru'])
            ->assertJsonPath('errors.first_name.0', 'Поле имя обязательно.');

        $this->postJson('/api/auth/register', [], ['Accept-Language' => 'de'])
            ->assertJsonPath('errors.first_name.0', 'The first name field is required.');
    }

    /** Valid "Finish signing up" form. */
    private function signup(array $overrides = []): array
    {
        return array_merge([
            'first_name' => 'Ana',
            'last_name' => 'Pop',
            'birth_date' => '1995-04-12',
            'email' => 'ana@example.com',
            'password' => 'secret123',
        ], $overrides);
    }

    public function test_user_can_log_in(): void
    {
        $user = User::factory()->host()->create(['email' => 'host@example.com']);

        $this->postJson('/api/auth/login', ['email' => 'HOST@example.com', 'password' => 'password'])
            ->assertOk()
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonPath('user.role', 'host')
            ->assertJsonStructure(['token']);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        User::factory()->create(['email' => 'guest@example.com']);

        $this->postJson('/api/auth/login', ['email' => 'guest@example.com', 'password' => 'wrong'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    public function test_deleted_user_cannot_log_in(): void
    {
        User::factory()->create(['email' => 'gone@example.com'])->delete();

        $this->postJson('/api/auth/login', ['email' => 'gone@example.com', 'password' => 'password'])
            ->assertUnprocessable();
    }

    public function test_logout_revokes_only_the_current_token(): void
    {
        $user = User::factory()->create();
        $current = $user->createToken('laptop')->plainTextToken;
        $user->createToken('phone');

        $this->postJson('/api/auth/logout', [], ['Authorization' => "Bearer $current"])->assertOk();

        $this->assertSame(['phone'], $user->tokens()->pluck('name')->all());
        $this->assertNull(PersonalAccessToken::findToken($current));
    }

    public function test_protected_routes_need_a_token(): void
    {
        $this->getJson('/api/user')->assertUnauthorized();
        $this->postJson('/api/auth/logout')->assertUnauthorized();
    }
}
