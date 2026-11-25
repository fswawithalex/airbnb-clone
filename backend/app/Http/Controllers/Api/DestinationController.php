<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Property;
use Illuminate\Http\JsonResponse;

class DestinationController extends Controller
{
    /**
     * Cities that have published stays, busiest first: the search bar's "Suggested destinations"
     * and the map's starting point. [{ city, country, stays, latitude, longitude }]
     */
    public function index(): JsonResponse
    {
        $destinations = Property::published()
            ->toBase()
            ->selectRaw('city, country, COUNT(*) as stays, AVG(latitude) as latitude, AVG(longitude) as longitude')
            ->groupBy('city', 'country')
            ->orderByDesc('stays')
            ->orderBy('city')
            ->get()
            ->map(fn (object $row) => [
                'city' => $row->city,
                'country' => $row->country,
                'stays' => (int) $row->stays,
                'latitude' => $row->latitude === null ? null : round((float) $row->latitude, 5),
                'longitude' => $row->longitude === null ? null : round((float) $row->longitude, 5),
            ]);

        return response()->json($destinations);
    }
}
