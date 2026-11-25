<?php

namespace Tests\Feature\Offerings;

use App\Enums\PropertyType;
use App\Models\Booking;
use App\Models\Experience;
use App\Models\Property;
use App\Models\Review;
use App\Models\Service;
use App\Models\User;
use Database\Seeders\HotelExperienceServiceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Homepage tabs: GET /api/experiences, GET /api/services and the seeder that fills them. */
class OfferingApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_experiences_list_only_published_ones_with_their_host(): void
    {
        $published = Experience::factory()->create();
        Experience::factory()->draft()->create();

        $this->getJson('/api/experiences')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $published->id)
            ->assertJsonPath('0.host.name', $published->host->name)
            ->assertJsonPath('0.category', $published->category->value);
    }

    public function test_services_can_be_searched_by_location_and_guests(): void
    {
        $chefInRome = Service::factory()->create(['city' => 'Rome', 'country' => 'Italy', 'max_guests' => 6]);
        $soloInRome = Service::factory()->create(['city' => 'Rome', 'country' => 'Italy', 'max_guests' => 1]);
        Service::factory()->create(['city' => 'Paris', 'country' => 'France', 'title' => 'Photo shoot in Paris']);

        $ids = fn (array $query) => array_column($this->getJson('/api/services?'.http_build_query($query))->assertOk()->json(), 'id');

        $this->assertEqualsCanonicalizing([$chefInRome->id, $soloInRome->id], $ids(['location' => 'italy']));
        $this->assertEquals([$chefInRome->id], $ids(['location' => 'rome', 'guests' => 4]));
        $this->getJson('/api/services?guests=0')->assertJsonValidationErrors('guests');
    }

    public function test_details_are_public_but_drafts_are_hidden(): void
    {
        $experience = Experience::factory()->create();
        $draft = Service::factory()->draft()->create();

        $this->getJson("/api/experiences/{$experience->id}")
            ->assertOk()
            ->assertJsonPath('title', $experience->title)
            ->assertJsonPath('host.id', $experience->host_id);
        $this->getJson("/api/services/{$draft->id}")->assertNotFound();
        $this->getJson('/api/services/999')->assertNotFound();
    }

    public function test_homes_and_hotels_tabs_split_the_listings(): void
    {
        $home = Property::factory()->create(['property_type' => PropertyType::Villa]);
        $hotel = Property::factory()->hotel()->create();

        $ids = fn (string $query) => array_column($this->getJson("/api/properties{$query}")->assertOk()->json(), 'id');

        $this->assertEqualsCanonicalizing([$home->id, $hotel->id], $ids(''));
        $this->assertEquals([$home->id], $ids('?category=homes'));
        $this->assertEquals([$hotel->id], $ids('?category=hotels'));
        $this->getJson('/api/properties?category=castles')->assertJsonValidationErrors('category');
    }

    public function test_destinations_group_published_stays_by_city_busiest_first(): void
    {
        Property::factory(2)->create(['city' => 'Rome', 'country' => 'Italy', 'latitude' => 41.9, 'longitude' => 12.5]);
        Property::factory()->create(['city' => 'Rome', 'country' => 'Italy', 'latitude' => 42.0, 'longitude' => 12.6]);
        Property::factory()->create(['city' => 'Paris', 'country' => 'France']);
        Property::factory()->draft()->create(['city' => 'Oslo', 'country' => 'Norway']);

        $this->getJson('/api/destinations')
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonPath('0.city', 'Rome')
            ->assertJsonPath('0.country', 'Italy')
            ->assertJsonPath('0.stays', 3)
            ->assertJsonPath('0.latitude', 41.93333)
            ->assertJsonPath('1.city', 'Paris')
            ->assertJsonPath('1.stays', 1);
    }

    public function test_listings_come_with_their_average_rating_and_review_count(): void
    {
        $reviewed = Property::factory()->create();
        foreach ([5, 4] as $rating) {
            $booking = Booking::factory()->for($reviewed)->completed()->create();
            Review::factory()->for($booking)->create(['rating' => $rating]);
        }
        $new = Property::factory()->create();

        $listings = collect($this->getJson('/api/properties')->assertOk()->json())->keyBy('id');

        $this->assertEquals(4.5, $listings[$reviewed->id]['reviews_avg_rating']);
        $this->assertSame(2, $listings[$reviewed->id]['reviews_count']);
        $this->assertNull($listings[$new->id]['reviews_avg_rating']);
        $this->assertSame(0, $listings[$new->id]['reviews_count']);
    }

    public function test_seeder_adds_hotels_experiences_and_services_once(): void
    {
        $host = User::factory()->host()->create();

        $this->seed(HotelExperienceServiceSeeder::class);
        $this->seed(HotelExperienceServiceSeeder::class); // second run adds nothing

        $this->assertSame(6, Property::where('property_type', PropertyType::Hotel)->count());
        $this->assertSame(13, Experience::count()); // 12 published + 1 draft
        $this->assertSame(11, Service::count());
        $this->assertSame(0, Experience::where('host_id', '!=', $host->id)->count(), 'uses the existing hosts');
        $this->getJson('/api/experiences')->assertJsonCount(12);
    }
}
