<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Property;
use Illuminate\Http\Request;

class PropertyController extends Controller
{
    // 1. Получить все опубликованные квартиры (для витрины)
    public function index()
    {
        $properties = Property::published()
            ->with(['primaryImage', 'host:id,name'])
            ->latest()
            ->get();

        return response()->json($properties);
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
