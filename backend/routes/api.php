<?php

use App\Http\Controllers\Api\Admin\UserController as AdminUserController;
use App\Http\Controllers\Api\AmenityController;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Auth\PasswordResetController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\DestinationController;
use App\Http\Controllers\Api\ExperienceController;
use App\Http\Controllers\Api\HostReservationController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\PropertyController;
use App\Http\Controllers\Api\ServiceController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

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

Route::get('/amenities', [AmenityController::class, 'index']);
Route::get('/destinations', [DestinationController::class, 'index']);
Route::get('/experiences', [ExperienceController::class, 'index']);
Route::get('/experiences/{experience}', [ExperienceController::class, 'show'])->whereNumber('experience');
Route::get('/services', [ServiceController::class, 'index']);
Route::get('/services/{service}', [ServiceController::class, 'show'])->whereNumber('service');
Route::get('/properties', [PropertyController::class, 'index']);
Route::get('/properties/{property}', [PropertyController::class, 'show'])->whereNumber('property');
Route::get('/properties/{property}/availability', [BookingController::class, 'availability'])->whereNumber('property');
Route::get('/properties/{property}/unavailable-dates', [BookingController::class, 'unavailableDates'])->whereNumber('property');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/properties', [PropertyController::class, 'store']);
    Route::put('/properties/{property}', [PropertyController::class, 'update']);
    Route::delete('/properties/{property}', [PropertyController::class, 'destroy']);
});

/*
| Module 3: bookings & reservations. Contract: docs/api-bookings.md
| Guest side: any logged-in user can book (hosts too, just not their own listings).
*/
Route::middleware('auth:sanctum')->prefix('bookings')->group(function () {
    Route::get('/', [BookingController::class, 'index']);
    Route::post('/', [BookingController::class, 'store'])->middleware('throttle:20,1');
    Route::get('/{booking}', [BookingController::class, 'show'])->whereNumber('booking');
    Route::post('/{booking}/cancel', [BookingController::class, 'cancel'])->whereNumber('booking');
    Route::post('/{booking}/pay', [BookingController::class, 'pay'])->whereNumber('booking');
});

// Host side: requests on the listings I host
Route::middleware(['auth:sanctum', 'role:host,admin'])->prefix('host/reservations')->group(function () {
    Route::get('/', [HostReservationController::class, 'index']);
    Route::post('/{booking}/approve', [HostReservationController::class, 'approve'])->whereNumber('booking');
    Route::post('/{booking}/reject', [HostReservationController::class, 'reject'])->whereNumber('booking');
    Route::post('/{booking}/cancel', [HostReservationController::class, 'cancel'])->whereNumber('booking');
});
