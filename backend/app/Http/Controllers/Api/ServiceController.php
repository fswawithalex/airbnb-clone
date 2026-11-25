<?php

namespace App\Http\Controllers\Api;

use App\Enums\PropertyStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\OfferingSearchRequest;
use App\Models\Service;
use Illuminate\Http\JsonResponse;

/** Homepage "Services" tab (read-only for now). */
class ServiceController extends Controller
{
    public function index(OfferingSearchRequest $request): JsonResponse
    {
        return response()->json(
            Service::published()
                ->search($request->validated('location'), $request->validated('guests'))
                ->with('host:id,name')
                ->latest()
                ->get(),
        );
    }

    public function show(Service $service): JsonResponse
    {
        abort_unless($service->status === PropertyStatus::Published, 404);

        return response()->json($service->load('host:id,name'));
    }
}
