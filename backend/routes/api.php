<?php

use App\Http\Controllers\Api\PropertyController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

// Used by the frontend start page and by `docker compose` checks: is the API up and can it reach MySQL?
Route::get('/health', function () {
    try {
        DB::select('SELECT 1');
        $database = 'connected';
    } catch (Throwable) {
        $database = 'unavailable';
    }

    $ok = $database === 'connected';

    return response()->json([
        'status' => $ok ? 'ok' : 'degraded',
        'database' => $database,
        'app' => config('app.name'),
    ], $ok ? 200 : 503);
});

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/properties', [PropertyController::class, 'index']);
Route::get('/properties/{property}', [PropertyController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/properties', [PropertyController::class, 'store']);
    Route::put('/properties/{property}', [PropertyController::class, 'update']);
    Route::delete('/properties/{property}', [PropertyController::class, 'destroy']);
});
