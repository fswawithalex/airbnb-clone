<?php

namespace App\Http\Controllers\Api;

use App\Enums\PropertyStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\OfferingSearchRequest;
use App\Models\Experience;
use Illuminate\Http\JsonResponse;

/** Homepage "Experiences" tab (read-only for now). */
class ExperienceController extends Controller
{
    public function index(OfferingSearchRequest $request): JsonResponse
    {
        return response()->json(
            Experience::published()
                ->search($request->validated('location'), $request->validated('guests'))
                ->with('host:id,name')
                ->latest()
                ->get(),
        );
    }

    public function show(Experience $experience): JsonResponse
    {
        abort_unless($experience->status === PropertyStatus::Published, 404);

        return response()->json($experience->load('host:id,name'));
    }
}
