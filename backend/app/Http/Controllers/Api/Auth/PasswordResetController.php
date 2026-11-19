<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;

/**
 * Forgot / reset password. The email link opens the React page
 * FRONTEND_URL/reset-password?token=...&email=... (see AppServiceProvider),
 * which then POSTs here.
 */
class PasswordResetController extends Controller
{
    public function sendLink(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'string', 'email']]);

        Password::sendResetLink(['email' => strtolower(trim($request->email))]);

        // Same answer whether or not the email exists, so nobody can probe for accounts.
        return response()->json([
            'message' => __('If an account exists for this email, we have sent a password reset link.'),
        ]);
    }

    public function reset(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'confirmed', PasswordRule::defaults()],
        ]);
        $data['email'] = strtolower(trim($data['email']));

        $status = Password::reset($data, function (User $user, string $password) {
            $user->forceFill([
                'password' => $password, // hashed by the model cast
                'remember_token' => Str::random(60),
            ])->save();

            // Log out every device that used the old password.
            $user->tokens()->delete();

            event(new PasswordReset($user));
        });

        if ($status !== Password::PasswordReset) {
            throw ValidationException::withMessages(['email' => __($status)]);
        }

        return response()->json(['message' => __($status)]);
    }
}
