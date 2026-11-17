<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Bearer-token auth with Sanctum personal access tokens.
 * The frontend stores the token and sends "Authorization: Bearer <token>".
 */
class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        // role is not fillable, so everybody starts as a guest (see POST /user/become-host).
        $user = User::create($request->validated());

        return $this->tokenResponse($user, $request->userAgent(), 201);
    }

    /**
     * Step 1 of the Airbnb-style modal: does this email have an account?
     * The UI then asks for the password (log in) or shows "Finish signing up".
     */
    public function checkEmail(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'string', 'email', 'max:255']]);

        return response()->json([
            'exists' => User::withTrashed()->where('email', strtolower(trim($data['email'])))->exists(),
        ]);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        // SoftDeletes: deleted accounts are not found here and cannot log in.
        $user = User::where('email', $request->validated('email'))->first();

        if (! $user || ! Hash::check($request->validated('password'), $user->password)) {
            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        return $this->tokenResponse($user, $request->validated('device_name') ?? $request->userAgent());
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => __('Logged out.')]);
    }

    private function tokenResponse(User $user, ?string $deviceName, int $status = 200): JsonResponse
    {
        $token = $user->createToken(mb_substr($deviceName ?: 'web', 0, 100))->plainTextToken;

        return response()->json([
            'user' => new UserResource($user->refresh()),
            'token' => $token,
        ], $status);
    }
}
