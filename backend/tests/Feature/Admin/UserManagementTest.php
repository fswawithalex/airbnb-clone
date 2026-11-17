<?php

namespace Tests\Feature\Admin;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->admin()->create(['name' => 'Admin']);
    }

    public function test_only_admins_can_access(): void
    {
        $this->getJson('/api/admin/users')->assertUnauthorized();

        Sanctum::actingAs(User::factory()->create());
        $this->getJson('/api/admin/users')->assertForbidden();

        Sanctum::actingAs(User::factory()->host()->create());
        $this->getJson('/api/admin/users')->assertForbidden();

        Sanctum::actingAs($this->admin);
        $this->getJson('/api/admin/users')->assertOk();
    }

    public function test_list_is_paginated_and_filterable(): void
    {
        User::factory()->create(['name' => 'Maria Ionescu', 'email' => 'maria@example.com']);
        User::factory(3)->host()->create();
        User::factory()->create(['name' => 'Deleted Guy'])->delete();
        Sanctum::actingAs($this->admin);

        $this->getJson('/api/admin/users')
            ->assertOk()
            ->assertJsonCount(5, 'data')
            ->assertJsonStructure(['data', 'links', 'meta' => ['current_page', 'last_page', 'total']])
            ->assertJsonPath('data.0.deleted_at', null);

        $this->getJson('/api/admin/users?search=maria')->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.email', 'maria@example.com');
        $this->getJson('/api/admin/users?role=host')->assertJsonCount(3, 'data');
        $this->getJson('/api/admin/users?trashed=only')->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Deleted Guy');
        $this->getJson('/api/admin/users?trashed=with')->assertJsonCount(6, 'data');
        $this->getJson('/api/admin/users?role=superuser')->assertUnprocessable();
    }

    public function test_search_treats_percent_literally(): void
    {
        User::factory()->create(['name' => '100% Host']);
        Sanctum::actingAs($this->admin);

        $this->getJson('/api/admin/users?search='.urlencode('%'))->assertJsonCount(1, 'data');
    }

    public function test_admin_can_change_a_role(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($this->admin);

        $this->putJson("/api/admin/users/{$user->id}/role", ['role' => 'host'])
            ->assertOk()->assertJsonPath('data.role', 'host');
        $this->assertSame(UserRole::Host, $user->refresh()->role);

        $this->putJson("/api/admin/users/{$user->id}/role", ['role' => 'king'])->assertUnprocessable();
    }

    public function test_admin_cannot_change_own_role_or_delete_self(): void
    {
        Sanctum::actingAs($this->admin);

        $this->putJson("/api/admin/users/{$this->admin->id}/role", ['role' => 'guest'])->assertUnprocessable();
        $this->deleteJson("/api/admin/users/{$this->admin->id}")->assertUnprocessable();

        $this->assertSame(UserRole::Admin, $this->admin->refresh()->role);
        $this->assertNotSoftDeleted($this->admin);
    }

    public function test_admin_can_delete_and_restore_a_user(): void
    {
        $user = User::factory()->create();
        $user->createToken('phone');
        Sanctum::actingAs($this->admin);

        $this->deleteJson("/api/admin/users/{$user->id}")->assertOk();
        $this->assertSoftDeleted($user);
        $this->assertSame(0, $user->tokens()->count());

        $this->getJson("/api/admin/users/{$user->id}")->assertOk()
            ->assertJsonPath('data.id', $user->id);

        $this->postJson("/api/admin/users/{$user->id}/restore")->assertOk()
            ->assertJsonPath('data.deleted_at', null);
        $this->assertNotSoftDeleted($user);
    }
}
