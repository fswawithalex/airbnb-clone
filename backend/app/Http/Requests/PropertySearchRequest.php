<?php

namespace App\Http\Requests;

use App\Enums\PropertyType;
use App\Support\FlexibleStay;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Query string for GET /api/properties (homepage search bar + filters). Every field is optional.
 *
 * Example: /api/properties?location=Brasov&check_in=2027-03-10&check_out=2027-03-13&flexible_days=2&guests=2
 *          &min_price=50&max_price=200&types[]=villa&types[]=cabin&bedrooms=2&amenities[]=1&amenities[]=4
 * Flexible dates instead of check_in/check_out: ?stay=week&months[]=2027-03&months[]=2027-04
 */
class PropertySearchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Homepage tab: "homes" = every type except hotel, "hotels" = only hotels (omit for both)
            'category' => ['nullable', Rule::in(['homes', 'hotels'])],
            // Matches city, country or title
            'location' => ['nullable', 'string', 'max:100'],
            // Dates come as a pair: only listings free for the whole stay are returned
            'check_in' => ['nullable', 'required_with:check_out', 'date_format:Y-m-d', 'after_or_equal:today'],
            'check_out' => ['nullable', 'required_with:check_in', 'date_format:Y-m-d', 'after:check_in'],
            // "± N days" under the calendar: the same number of nights may start up to N days earlier or later
            'flexible_days' => ['nullable', 'integer', Rule::in([0, 1, 2, 3, 7, 14])],
            // "Flexible" tab instead of dates: a weekend / week / month starting in one of these months (none = next 6)
            'stay' => ['nullable', Rule::in(array_keys(FlexibleStay::NIGHTS)), 'prohibits:check_in,check_out'],
            'months' => ['nullable', 'array', 'max:12'],
            'months.*' => ['date_format:Y-m', 'distinct'],
            // Adults + children (infants don't count, like on Airbnb)
            'guests' => ['nullable', 'integer', 'min:1', 'max:65535'],
            // Any pets: only listings with pets_allowed
            'pets' => ['nullable', 'integer', 'min:0', 'max:5'],
            'min_price' => ['nullable', 'numeric', 'min:0'],
            // gte only when min_price is sent too, otherwise "max_price=200" alone would fail
            'max_price' => ['nullable', 'numeric', 'min:0', Rule::when($this->filled('min_price'), 'gte:min_price')],
            'types' => ['nullable', 'array'],
            'types.*' => [Rule::enum(PropertyType::class)],
            // Minimum number of bedrooms
            'bedrooms' => ['nullable', 'integer', 'min:0', 'max:65535'],
            // Listing must have every selected amenity
            'amenities' => ['nullable', 'array'],
            'amenities.*' => ['integer', 'distinct', 'exists:amenities,id'],
        ];
    }
}
