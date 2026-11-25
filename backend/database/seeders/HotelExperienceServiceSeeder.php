<?php

namespace Database\Seeders;

use App\Enums\PropertyType;
use App\Enums\UserRole;
use App\Models\Amenity;
use App\Models\Experience;
use App\Models\Property;
use App\Models\PropertyImage;
use App\Models\Service;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Demo content for the homepage tabs Hotels, Experiences and Services, owned by the existing hosts.
 *
 * Part of `php artisan migrate:fresh --seed`. Also safe on a database that already has data:
 *   php artisan db:seed --class=HotelExperienceServiceSeeder
 * Each part is skipped when that kind of data already exists, so running it twice adds nothing.
 */
class HotelExperienceServiceSeeder extends Seeder
{
    public function run(): void
    {
        $hosts = User::where('role', UserRole::Host)->get();
        if ($hosts->isEmpty()) {
            $hosts = User::factory(2)->host()->create();
        }
        $hostId = fn () => ['host_id' => $hosts->random()->id];
        // Hotels go to the other hosts, so host@example.com keeps the 4 + 1 listings the README promises
        $hotelHosts = $hosts->where('email', '!=', 'host@example.com')->whenEmpty(fn () => $hosts);
        $hotelHostId = fn () => ['host_id' => $hotelHosts->random()->id];

        if (! Property::where('property_type', PropertyType::Hotel)->exists()) {
            $amenities = Amenity::all();
            Property::factory(6)->hotel()->state($hotelHostId)->create()->each(function (Property $hotel) use ($amenities) {
                foreach (range(0, 3) as $position) {
                    PropertyImage::factory()->for($hotel)->create(['is_primary' => $position === 0, 'sort_order' => $position]);
                }
                if ($amenities->isNotEmpty()) {
                    $hotel->amenities()->attach($amenities->random(min(5, $amenities->count()))->pluck('id'));
                }
            });
        }

        if (! Experience::exists()) {
            Experience::factory(12)->state($hostId)->create();
            Experience::factory()->draft()->state($hostId)->create();
        }

        if (! Service::exists()) {
            Service::factory(10)->state($hostId)->create();
            Service::factory()->draft()->state($hostId)->create();
        }
    }
}
