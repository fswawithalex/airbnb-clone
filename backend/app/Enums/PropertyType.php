<?php

namespace App\Enums;

/**
 * Stored in properties.property_type (VARCHAR), so adding a case needs no migration.
 * Validate input with: Rule::enum(PropertyType::class)
 */
enum PropertyType: string
{
    case Apartment = 'apartment';
    case House = 'house';
    case Villa = 'villa';
    case Cabin = 'cabin';
    case Cottage = 'cottage';
    case Studio = 'studio';
    case Room = 'room';
    // "Hotels" tab on the homepage; every other type is a "Home"
    case Hotel = 'hotel';

    public function label(): string
    {
        return ucfirst($this->value);
    }
}
