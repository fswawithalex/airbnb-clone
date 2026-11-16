<?php

namespace Tests\Feature\Profile;

use App\Enums\PropertyStatus;
use App\Enums\UserRole;
use App\Models\Property;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    /** Real token, for endpoints that use currentAccessToken(). */
    private function bearer(User $user, string $device = 'test'): array
    {
        return ['Authorization' => 'Bearer '.$user->createToken($device)->plainTextToken];
    }

    public function test_user_can_update_profile(): void
    {
        Sanctum::actingAs($user = User::factory()->create());

        $this->putJson('/api/user/profile', ['first_name' => 'Maria', 'last_name' => 'Ionescu', 'email' => 'New@Example.com', 'phone' => null])
            ->assertOk()
            ->assertJsonPath('data.first_name', 'Maria')
            ->assertJsonPath('data.name', 'Maria Ionescu')
            ->assertJsonPath('data.email', 'new@example.com')
            ->assertJsonPath('data.phone', null);

        $this->assertSame('new@example.com', $user->refresh()->email);
    }

    public function test_email_must_stay_unique_but_own_email_is_fine(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);
        Sanctum::actingAs(User::factory()->create(['email' => 'me@example.com']));

        $this->putJson('/api/user/profile', ['email' => 'taken@example.com'])
            ->assertUnprocessable()->assertJsonValidationErrors('email');

        $this->putJson('/api/user/profile', ['email' => 'me@example.com'])->assertOk();
    }

    public function test_profile_update_cannot_change_role(): void
    {
        Sanctum::actingAs($user = User::factory()->create());

        $this->putJson('/api/user/profile', ['role' => 'admin'])->assertOk();

        $this->assertSame(UserRole::Guest, $user->refresh()->role);
    }

    public function test_avatar_upload_replaces_the_old_file(): void
    {
        Storage::fake('public');
        Sanctum::actingAs($user = User::factory()->create());

        $first = $this->post('/api/user/avatar', ['avatar' => UploadedFile::fake()->image('a.jpg')], ['Accept' => 'application/json'])
            ->assertOk()->json('data.avatar_url');
        $firstPath = $user->refresh()->avatar;
        Storage::disk('public')->assertExists($firstPath);
        $this->assertStringContainsString($firstPath, $first);

        $this->post('/api/user/avatar', ['avatar' => UploadedFile::fake()->image('b.png')], ['Accept' => 'application/json'])
            ->assertOk();

        Storage::disk('public')->assertMissing($firstPath);
        Storage::disk('public')->assertExists($user->refresh()->avatar);
    }

    public function test_avatar_must_be_an_image(): void
    {
        Storage::fake('public');
        Sanctum::actingAs(User::factory()->create());

        $this->post('/api/user/avatar', ['avatar' => UploadedFile::fake()->create('cv.pdf', 10, 'application/pdf')], ['Accept' => 'application/json'])
            ->assertUnprocessable()->assertJsonValidationErrors('avatar');
    }

    public function test_avatar_can_be_removed(): void
    {
        Storage::fake('public');
        Sanctum::actingAs($user = User::factory()->create());
        $this->post('/api/user/avatar', ['avatar' => UploadedFile::fake()->image('a.jpg')], ['Accept' => 'application/json']);
        $path = $user->refresh()->avatar;

        $this->deleteJson('/api/user/avatar')->assertOk()->assertJsonPath('data.avatar_url', null);

        Storage::disk('public')->assertMissing($path);
    }

    public function test_password_change_keeps_this_device_and_logs_out_others(): void
    {
        $user = User::factory()->create();
        $user->createToken('other-device');
        $headers = $this->bearer($user, 'this-device');

        $this->putJson('/api/user/password', [
            'current_password' => 'password',
            'password' => 'newpass123',
            'password_confirmation' => 'newpass123',
        ], $headers)->assertOk();

        $this->assertTrue(Hash::check('newpass123', $user->refresh()->password));
        $this->assertSame(['this-device'], $user->tokens()->pluck('name')->all());
    }

    public function test_password_change_needs_the_current_password(): void
    {
        $user = User::factory()->create();

        $this->putJson('/api/user/password', [
            'current_password' => 'wrong',
            'password' => 'newpass123',
            'password_confirmation' => 'newpass123',
        ], $this->bearer($user))->assertUnprocessable()->assertJsonValidationErrors('current_password');
    }

    public function test_guest_can_become_host(): void
    {
        Sanctum::actingAs($user = User::factory()->create());

        $this->postJson('/api/user/become-host')->assertOk()->assertJsonPath('data.role', 'host');

        $this->assertSame(UserRole::Host, $user->refresh()->role);
    }

    public function test_admin_cannot_become_host(): void
    {
        Sanctum::actingAs($admin = User::factory()->admin()->create());

        $this->postJson('/api/user/become-host')->assertUnprocessable();

        $this->assertSame(UserRole::Admin, $admin->refresh()->role);
    }

    public function test_user_can_delete_own_account_with_password(): void
    {
        $user = User::factory()->create();
        $headers = $this->bearer($user);

        $this->deleteJson('/api/user', ['password' => 'wrong'], $headers)->assertUnprocessable();
        $this->deleteJson('/api/user', ['password' => 'password'], $headers)->assertOk();

        $this->assertSoftDeleted($user);
        $this->assertSame(0, $user->tokens()->count());
    }

    public function test_public_profile_hides_private_data(): void
    {
        $host = User::factory()->host()->create(['phone' => '+40700000000']);
        Property::factory(2)->for($host, 'host')->create(['status' => PropertyStatus::Published]);
        Property::factory()->draft()->for($host, 'host')->create();

        $this->getJson("/api/users/{$host->id}")
            ->assertOk()
            ->assertJsonPath('data.name', $host->first_name) // first name only, like Airbnb
            ->assertJsonMissingPath('data.birth_date')
            ->assertJsonPath('data.listings_count', 2)
            ->assertJsonMissingPath('data.email')
            ->assertJsonMissingPath('data.phone');
    }

    public function test_public_profile_of_deleted_user_is_not_found(): void
    {
        $user = User::factory()->create();
        $user->delete();

        $this->getJson("/api/users/{$user->id}")->assertNotFound();
    }
}
