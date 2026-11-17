<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\UpdatePasswordRequest;
use App\Http\Requests\Profile\UpdateProfileRequest;
use App\Http\Resources\PublicUserResource;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Everything the logged-in user can do with their own account,
 * plus the public profile page of any user.
 */
class ProfileController extends Controller
{
    public function show(Request $request): UserResource
    {
        return new UserResource($request->user());
    }

    public function update(UpdateProfileRequest $request): UserResource
    {
        $request->user()->update($request->validated());

        return new UserResource($request->user()->refresh());
    }

    public function updateAvatar(Request $request): UserResource
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $user = $request->user();
        $this->deleteStoredAvatar($user);

        $user->update([
            'avatar' => $request->file('avatar')->store("avatars/{$user->id}", 'public'),
        ]);

        return new UserResource($user);
    }

    public function destroyAvatar(Request $request): UserResource
    {
        $user = $request->user();
        $this->deleteStoredAvatar($user);
        $user->update(['avatar' => null]);

        return new UserResource($user);
    }

    public function updatePassword(UpdatePasswordRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->update(['password' => $request->validated('password')]);

        // Stay logged in here, log out every other device.
        $user->tokens()->whereKeyNot($user->currentAccessToken()->getKey())->delete();

        return response()->json(['message' => __('Password updated.')]);
    }

    public function becomeHost(Request $request): UserResource
    {
        $user = $request->user();

        abort_if($user->isAdmin(), 422, __('Admins already have every permission.'));

        if (! $user->isHost()) {
            // role is not mass-assignable on purpose: set it explicitly.
            $user->role = UserRole::Host;
            $user->save();
        }

        return new UserResource($user);
    }

    public function destroy(Request $request): JsonResponse
    {
        $request->validate([
            'password' => ['required', 'string', 'current_password:sanctum'],
        ]);

        $user = $request->user();
        $user->tokens()->delete();
        $user->delete(); // soft delete: bookings, reviews and payments stay intact

        return response()->json(['message' => __('Account deleted.')]);
    }

    public function publicProfile(User $user): PublicUserResource
    {
        $user->loadCount([
            'properties' => fn ($query) => $query->published(),
            'reviews',
        ]);

        return new PublicUserResource($user);
    }

    private function deleteStoredAvatar(User $user): void
    {
        // Seeded/external avatars are full URLs, not files on our disk.
        if ($user->avatar && ! str_starts_with($user->avatar, 'http')) {
            Storage::disk('public')->delete($user->avatar);
        }
    }
}
