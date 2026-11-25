<?php

namespace App\Http\Controllers\Api;

use App\Enums\PropertyType;
use App\Http\Controllers\Controller;
use App\Http\Requests\PropertySearchRequest;
use App\Models\Property;
use App\Support\FlexibleStay;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class PropertyController extends Controller
{
    // 1. Получить все опубликованные квартиры (для витрины)
    // Homepage search bar + filters: every query param is optional, see PropertySearchRequest.
    public function index(PropertySearchRequest $request)
    {
        $filters = $request->validated();

        $properties = Property::published()
            ->when($filters['category'] ?? null, fn (Builder $query, string $category) => $category === 'hotels'
                ? $query->where('property_type', PropertyType::Hotel)
                : $query->where('property_type', '!=', PropertyType::Hotel))
            ->when($filters['location'] ?? null, function (Builder $query, string $location) {
                // Escape LIKE wildcards so "%" or "_" typed by the user match literally
                $like = '%'.addcslashes($location, '%_\\').'%';
                $query->where(fn (Builder $q) => $q
                    ->where('city', 'like', $like)
                    ->orWhere('country', 'like', $like)
                    ->orWhere('title', 'like', $like));
            })
            ->when(
                isset($filters['check_in'], $filters['check_out']),
                fn (Builder $query) => $this->whereFreeAround($query, $filters['check_in'], $filters['check_out'], (int) ($filters['flexible_days'] ?? 0)),
            )
            ->when($filters['guests'] ?? null, fn (Builder $query, int $guests) => $query->where('max_guests', '>=', $guests))
            ->when($filters['pets'] ?? null, fn (Builder $query) => $query->where('pets_allowed', true))
            ->when(isset($filters['min_price']), fn (Builder $query) => $query->where('price_per_night', '>=', $filters['min_price']))
            ->when(isset($filters['max_price']), fn (Builder $query) => $query->where('price_per_night', '<=', $filters['max_price']))
            ->when($filters['types'] ?? null, fn (Builder $query, array $types) => $query->whereIn('property_type', $types))
            ->when($filters['bedrooms'] ?? null, fn (Builder $query, int $bedrooms) => $query->where('bedrooms', '>=', $bedrooms))
            ->when($filters['amenities'] ?? null, fn (Builder $query, array $amenityIds) => $query->whereHas(
                'amenities',
                fn (Builder $q) => $q->whereIn('amenities.id', $amenityIds),
                '=',
                count($amenityIds),
            ))
            ->with(['primaryImage', 'host:id,name'])
            // For the cards: "★ 4.95 (108)" → reviews_avg_rating, reviews_count
            ->withAvg('reviews', 'rating')
            ->withCount('reviews')
            ->latest()
            ->get();

        if (isset($filters['stay'])) {
            $freeIds = FlexibleStay::filter($properties->modelKeys(), $filters['stay'], $filters['months'] ?? []);
            $properties = $properties->only($freeIds)->values();
        }

        return response()->json($properties);
    }

    /**
     * Free for the stay [checkIn, checkOut), or with "± N days" for the same number of nights moved
     * up to N days earlier or later (never starting in the past).
     */
    private function whereFreeAround(Builder $query, string $checkIn, string $checkOut, int $flexibleDays): void
    {
        $checkIn = Carbon::parse($checkIn);
        $checkOut = Carbon::parse($checkOut);
        $today = Carbon::today();

        $query->where(function (Builder $anyShift) use ($checkIn, $checkOut, $flexibleDays, $today) {
            foreach (range(-$flexibleDays, $flexibleDays) as $shift) {
                $shiftedIn = $checkIn->copy()->addDays($shift);
                if ($shiftedIn->lt($today)) {
                    continue;
                }
                $anyShift->orWhere(fn (Builder $q) => $q->availableBetween($shiftedIn, $checkOut->copy()->addDays($shift)));
            }
        });
    }

    // 2. Показать детали одной квартиры
    public function show(Property $property)
    {
        $property->load(['images', 'amenities', 'host:id,name']);

        return response()->json($property);
    }

    // 3. Создать новую квартиру (только для авторизованного хозяина)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'property_type' => 'required|string',
            'country' => 'required|string|max:100',
            'city' => 'required|string|max:100',
            'address' => 'required|string|max:255',
            'price_per_night' => 'required|numeric|min:1',
            'max_guests' => 'required|integer|min:1',
            'bedrooms' => 'required|integer|min:0',
            'beds' => 'required|integer|min:1',
            'bathrooms' => 'required|numeric|min:0.5',
            'pets_allowed' => 'sometimes|boolean',
            'status' => 'sometimes|string',
        ]);

        // Создаем через связь, как указано в комментарии к модели!
        $property = $request->user()->properties()->create($validated);

        // Если передали массив ID удобств (amenities)
        if ($request->has('amenities')) {
            $property->amenities()->sync($request->amenities);
        }

        return response()->json($property->load(['images', 'amenities']), 201);
    }

    // 4. Обновить свою квартиру
    public function update(Request $request, Property $property)
    {
        // Защита: редактировать может только владелец
        if ($property->host_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'property_type' => 'sometimes|string',
            'country' => 'sometimes|string|max:100',
            'city' => 'sometimes|string|max:100',
            'address' => 'sometimes|string|max:255',
            'price_per_night' => 'sometimes|numeric|min:1',
            'max_guests' => 'sometimes|integer|min:1',
            'bedrooms' => 'sometimes|integer|min:0',
            'beds' => 'sometimes|integer|min:1',
            'bathrooms' => 'sometimes|numeric|min:0.5',
            'pets_allowed' => 'sometimes|boolean',
            'status' => 'sometimes|string',
        ]);

        $property->update($validated);

        if ($request->has('amenities')) {
            $property->amenities()->sync($request->amenities);
        }

        return response()->json($property->load(['images', 'amenities']));
    }

    // 5. Удалить квартиру
    public function destroy(Request $request, Property $property)
    {
        if ($property->host_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $property->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
