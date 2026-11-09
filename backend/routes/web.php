<?php

use Illuminate\Support\Facades\Route;

// This app is a JSON API; all real endpoints live in routes/api.php under /api.
Route::get('/', fn () => response()->json([
    'name' => config('app.name'),
    'api' => url('/api'),
    'health' => url('/api/health'),
]));
