<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Amenity;
use Illuminate\Http\JsonResponse;

class AmenityController extends Controller
{
    /** All amenities, for the homepage filters dialog. */
    public function index(): JsonResponse
    {
        return response()->json(Amenity::orderBy('name')->get(['id', 'name', 'icon']));
    }
}
