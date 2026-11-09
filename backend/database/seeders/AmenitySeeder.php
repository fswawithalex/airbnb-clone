<?php

namespace Database\Seeders;

use App\Models\Amenity;
use Illuminate\Database\Seeder;

/**
 * Reference data (also needed in production). Safe to run repeatedly:
 *   php artisan db:seed --class=AmenitySeeder
 * Icons are Lucide icon names (https://lucide.dev) for the frontend.
 */
class AmenitySeeder extends Seeder
{
    public const AMENITIES = [
        'Wi-Fi' => 'wifi',
        'Air Conditioning' => 'snowflake',
        'Kitchen' => 'utensils',
        'Parking' => 'car',
        'Swimming Pool' => 'waves',
        'TV' => 'tv',
        'Washing Machine' => 'washing-machine',
        'Heating' => 'thermometer',
        'Workspace' => 'monitor',
        'Balcony' => 'sun',
    ];

    public function run(): void
    {
        foreach (self::AMENITIES as $name => $icon) {
            Amenity::updateOrCreate(['name' => $name], ['icon' => $icon]);
        }
    }
}
