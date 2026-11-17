<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/**
 * Admin user management. Routes: auth:sanctum + role:admin.
 * {user} is resolved with withTrashed() so deleted accounts can be viewed and restored.
 */
class UserController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'role' => ['nullable', Rule::enum(UserRole::class)],
            'trashed' => ['nullable', Rule::in(['with', 'only'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $users = User::query()
            ->when($filters['trashed'] ?? null, fn ($query, $trashed) => $trashed === 'only'
                ? $query->onlyTrashed()
                : $query->withTrashed())
            ->when($filters['search'] ?? null, fn ($query, $search) => $query->search($search))
            ->when($filters['role'] ?? null, fn ($query, $role) => $query->where('role', $role))
            ->latest('id')
            ->paginate($filters['per_page'] ?? 20)
            ->withQueryString();

        return UserResource::collection($users);
    }

    public function show(User $user): UserResource
    {
        return new UserResource($user);
    }

    public function updateRole(Request $request, User $user): UserResource
    {
        $data = $request->validate([
            'role' => ['required', Rule::enum(UserRole::class)],
        ]);

        abort_if($user->is($request->user()), 422, __('You cannot change your own role.'));
        abort_if($user->trashed(), 422, __('Restore this user before changing their role.'));

        $user->role = UserRole::from($data['role']);
        $user->save();

        return new UserResource($user);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        abort_if($user->is($request->user()), 422, __('You cannot delete your own account here.'));

        if (! $user->trashed()) {
            $user->tokens()->delete();
            $user->delete();
        }

        return response()->json(['message' => __('User deleted.')]);
    }

    public function restore(User $user): UserResource
    {
        $user->restore();

        return new UserResource($user);
    }
}
