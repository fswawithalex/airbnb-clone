<?php

use App\Http\Controllers\Api\Admin\UserController as AdminUserController;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Auth\PasswordResetController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\PropertyController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\BookingController;

// Used by the frontend start page and by `docker compose` checks: is the API up and can it reach MySQL?
// Route::get('/health', function () {
//     try {
//         DB::select('SELECT 1');
//         $database = 'connected';
//     } catch (Throwable) {
//         $database = 'unavailable';
//     }

//     $ok = $database === 'connected';

//     return response()->json([
//         'status' => $ok ? 'ok' : 'degraded',
//         'database' => $database,
//         'app' => config('app.name'),
//     ], $ok ? 200 : 503);
// });

/*
| Module 1: authentication & users. Contract: docs/api-auth.md
| Auth = "Authorization: Bearer <token>" (Sanctum personal access tokens).
*/
Route::prefix('auth')->group(function () {
    Route::post('/check-email', [AuthController::class, 'checkEmail'])->middleware('throttle:20,1');
    Route::middleware('throttle:6,1')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/forgot-password', [PasswordResetController::class, 'sendLink']);
    });
    Route::post('/reset-password', [PasswordResetController::class, 'reset'])->middleware('throttle:10,1');
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
});

Route::middleware('auth:sanctum')->prefix('user')->group(function () {
    Route::get('/', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::post('/avatar', [ProfileController::class, 'updateAvatar']);
    Route::delete('/avatar', [ProfileController::class, 'destroyAvatar']);
    Route::put('/password', [ProfileController::class, 'updatePassword']);
    Route::post('/become-host', [ProfileController::class, 'becomeHost']);
    Route::delete('/', [ProfileController::class, 'destroy']);
});

Route::get('/users/{user}', [ProfileController::class, 'publicProfile'])->whereNumber('user');

Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin/users')->group(function () {
    Route::get('/', [AdminUserController::class, 'index']);
    Route::get('/{user}', [AdminUserController::class, 'show'])->withTrashed();
    Route::put('/{user}/role', [AdminUserController::class, 'updateRole'])->withTrashed();
    Route::delete('/{user}', [AdminUserController::class, 'destroy'])->withTrashed();
    Route::post('/{user}/restore', [AdminUserController::class, 'restore'])->withTrashed();
});

Route::get('/properties', [PropertyController::class, 'index']);
Route::get('/properties/{properties}', [PropertyController::class, 'show']);
Route::get('/properties/{property}/availability', [BookingController::class, 'availability']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/properties', [PropertyController::class, 'store']);
    Route::put('/properties/{property}', [PropertyController::class, 'update']);
    Route::delete('/properties/{property}', [PropertyController::class, 'destroy']);
});

Route::middleware(['auth:sanctum', 'role:guest'])->group(function () {
    // Sanctum is used when authenticated; otherwise the configured test user is
    // available only in local development. Non-local unauthenticated calls return 401.
    Route::post('/bookings', [BookingController::class, 'store']);
    Route::get('/bookings', [BookingController::class, 'index']);
    Route::post('/bookings/{booking}/cancel',[BookingController::class, 'cancel'] );
});

Route::middleware(['auth:sanctum', 'role:host'])->group(function () {
    Route::get('/bookings/show', [BookingController::class, 'show']);
    Route::post('/bookings/{booking}/approve', [BookingController::class, 'approve']);
    Route::post('/bookings/{booking}/reject', [BookingController::class, 'reject']);
});

