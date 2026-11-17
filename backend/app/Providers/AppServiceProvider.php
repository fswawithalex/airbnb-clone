<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Password rules used by register, reset and change password.
        Password::defaults(fn () => Password::min(8)->letters()->numbers());

        // The reset email must open the React page, not a Laravel route.
        ResetPassword::createUrlUsing(fn (User $user, string $token) => config('app.frontend_url')
            .'/reset-password?token='.$token.'&email='.urlencode($user->email));
    }
}
