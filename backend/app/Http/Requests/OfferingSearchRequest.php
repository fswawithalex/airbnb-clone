<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/** Query string for GET /api/experiences and GET /api/services: ?location=Rome&guests=2 (both optional). */
class OfferingSearchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'location' => ['nullable', 'string', 'max:100'],
            'guests' => ['nullable', 'integer', 'min:1', 'max:65535'],
        ];
    }
}
