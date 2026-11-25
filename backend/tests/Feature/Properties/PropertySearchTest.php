<?php

namespace Tests\Feature\Properties;

use App\Enums\PropertyType;
use App\Models\Amenity;
use App\Models\Booking;
use App\Models\Property;
use App\Models\PropertyBlockedDate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Testing\TestResponse;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Homepage search bar + filters: GET /api/properties?... */
class PropertySearchTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2027-03-01 12:00:00');
    }

    private function listing(array $attributes = []): Property
    {
        return Property::factory()->create([
            'country' => 'Romania',
            'city' => 'Brasov',
            'title' => 'Listing',
            'property_type' => PropertyType::Apartment,
            'price_per_night' => 100,
            'max_guests' => 2,
            'bedrooms' => 1,
            ...$attributes,
        ]);
    }

    private function search(array $query = []): TestResponse
    {
        return $this->getJson('/api/properties?'.http_build_query($query));
    }

    /** @param  Property[]  $expected */
    private function assertFound(TestResponse $response, array $expected): void
    {
        $response->assertOk();
        $this->assertEqualsCanonicalizing(
            array_map(fn (Property $property) => $property->id, $expected),
            array_column($response->json(), 'id'),
        );
    }

    public function test_without_filters_it_returns_only_published_listings(): void
    {
        $published = $this->listing();
        $this->listing(['status' => 'draft']);
        $this->listing(['status' => 'inactive']);

        $this->assertFound($this->search(), [$published]);
    }

    public function test_location_matches_city_country_or_title_case_insensitively(): void
    {
        $brasov = $this->listing(['city' => 'Brasov']);
        $paris = $this->listing(['city' => 'Paris', 'country' => 'France']);
        $seaView = $this->listing(['city' => 'Nice', 'country' => 'France', 'title' => 'Sea view loft']);

        $this->assertFound($this->search(['location' => 'bra']), [$brasov]);
        $this->assertFound($this->search(['location' => 'france']), [$paris, $seaView]);
        $this->assertFound($this->search(['location' => 'sea view']), [$seaView]);
        $this->assertFound($this->search(['location' => '100%']), []);
    }

    public function test_dates_hide_listings_that_are_booked_or_blocked(): void
    {
        $free = $this->listing();
        $booked = $this->listing();
        $blocked = $this->listing();
        $cancelled = $this->listing();
        $checkoutDay = $this->listing();

        Booking::factory()->for($booked)->between('2027-03-12', '2027-03-15')->create();
        PropertyBlockedDate::factory()->for($blocked)->create(['start_date' => '2027-03-09', 'end_date' => '2027-03-11']);
        Booking::factory()->for($cancelled)->cancelled()->between('2027-03-10', '2027-03-13')->create();
        // Previous guest leaves on our check-in day: still free
        Booking::factory()->for($checkoutDay)->between('2027-03-05', '2027-03-10')->create();

        $this->assertFound(
            $this->search(['check_in' => '2027-03-10', 'check_out' => '2027-03-13']),
            [$free, $cancelled, $checkoutDay],
        );
    }

    public function test_flexible_days_also_accept_the_same_stay_moved_a_few_days(): void
    {
        $free = $this->listing();
        $freeTwoDaysLater = $this->listing();
        $freeThreeDaysEarlier = $this->listing();
        $fullyBooked = $this->listing();

        // Wanted: 10 → 13 (3 nights)
        Booking::factory()->for($freeTwoDaysLater)->between('2027-03-08', '2027-03-12')->create(); // 12 → 15 free
        Booking::factory()->for($freeThreeDaysEarlier)->between('2027-03-10', '2027-03-20')->create(); // 7 → 10 free
        Booking::factory()->for($fullyBooked)->between('2027-03-03', '2027-03-25')->create();

        $exact = ['check_in' => '2027-03-10', 'check_out' => '2027-03-13'];
        $this->assertFound($this->search($exact), [$free]);
        $this->assertFound($this->search([...$exact, 'flexible_days' => 2]), [$free, $freeTwoDaysLater]);
        $this->assertFound($this->search([...$exact, 'flexible_days' => 3]), [$free, $freeTwoDaysLater, $freeThreeDaysEarlier]);
    }

    public function test_flexible_days_never_move_the_stay_into_the_past(): void
    {
        // Today is 2027-03-01: "1 → 3 ± 7" must not find the free 22 → 24 Feb
        $listing = $this->listing();
        Booking::factory()->for($listing)->between('2027-03-01', '2027-03-15')->create();

        $this->assertFound($this->search(['check_in' => '2027-03-01', 'check_out' => '2027-03-03', 'flexible_days' => 7]), []);
    }

    public function test_flexible_weekend_needs_one_free_friday_to_sunday_in_the_chosen_months(): void
    {
        // March 2027 Fridays: 5, 12, 19, 26
        $lastWeekendFree = $this->listing();
        foreach (['05', '12', '19'] as $friday) {
            Booking::factory()->for($lastWeekendFree)->between("2027-03-{$friday}", '2027-03-'.($friday + 2))->create();
        }
        $marchBlocked = $this->listing();
        PropertyBlockedDate::factory()->for($marchBlocked)->create(['start_date' => '2027-03-01', 'end_date' => '2027-04-01']);
        $free = $this->listing();

        $this->assertFound($this->search(['stay' => 'weekend', 'months' => ['2027-03']]), [$lastWeekendFree, $free]);
        $this->assertFound($this->search(['stay' => 'weekend', 'months' => ['2027-03', '2027-04']]), [$lastWeekendFree, $marchBlocked, $free]);
    }

    public function test_flexible_week_and_month_need_a_long_enough_gap_starting_in_the_chosen_months(): void
    {
        // Longest gap in March is 5 nights, then blocked until mid-April
        $shortGaps = $this->listing();
        foreach (['05', '11', '17', '23'] as $day) {
            Booking::factory()->for($shortGaps)->between("2027-03-{$day}", '2027-03-'.($day + 1))->create();
        }
        PropertyBlockedDate::factory()->for($shortGaps)->create(['start_date' => '2027-03-29', 'end_date' => '2027-04-15']);

        // 28 free nights only from 16 March (a stay may run into April)
        $freeFromMid = $this->listing();
        Booking::factory()->for($freeFromMid)->between('2027-03-15', '2027-03-16')->create();

        // Something taken every few weeks: never 28 nights in a row
        $neverAMonth = $this->listing();
        PropertyBlockedDate::factory()->for($neverAMonth)->create(['start_date' => '2027-03-10', 'end_date' => '2027-03-11']);
        PropertyBlockedDate::factory()->for($neverAMonth)->create(['start_date' => '2027-04-01', 'end_date' => '2027-04-02']);
        PropertyBlockedDate::factory()->for($neverAMonth)->create(['start_date' => '2027-04-25', 'end_date' => '2027-04-26']);

        $this->assertFound($this->search(['stay' => 'week', 'months' => ['2027-03']]), [$freeFromMid, $neverAMonth]);
        $this->assertFound($this->search(['stay' => 'month', 'months' => ['2027-03']]), [$freeFromMid]);
    }

    public function test_flexible_stay_without_months_means_the_next_six_months(): void
    {
        $bookedUntilAugust = $this->listing();
        PropertyBlockedDate::factory()->for($bookedUntilAugust)->create(['start_date' => '2027-03-01', 'end_date' => '2027-08-25']);
        $bookedHalfYear = $this->listing();
        PropertyBlockedDate::factory()->for($bookedHalfYear)->create(['start_date' => '2027-03-01', 'end_date' => '2027-09-01']);

        // March → August: a week starting 25 August still fits; nothing starts in August for the other one
        $this->assertFound($this->search(['stay' => 'week']), [$bookedUntilAugust]);
        $this->assertFound($this->search(['stay' => 'week', 'months' => ['2027-09']]), [$bookedUntilAugust, $bookedHalfYear]);
    }

    public function test_guests_price_type_and_bedrooms_filters(): void
    {
        $small = $this->listing(['max_guests' => 2, 'price_per_night' => 50, 'bedrooms' => 1]);
        $villa = $this->listing(['max_guests' => 8, 'price_per_night' => 300, 'bedrooms' => 4, 'property_type' => PropertyType::Villa]);
        $cabin = $this->listing(['max_guests' => 4, 'price_per_night' => 150, 'bedrooms' => 2, 'property_type' => PropertyType::Cabin]);

        $this->assertFound($this->search(['guests' => 4]), [$villa, $cabin]);
        $this->assertFound($this->search(['min_price' => 100]), [$villa, $cabin]);
        $this->assertFound($this->search(['max_price' => 150]), [$small, $cabin]);
        $this->assertFound($this->search(['min_price' => 100, 'max_price' => 200]), [$cabin]);
        $this->assertFound($this->search(['types' => ['villa', 'cabin']]), [$villa, $cabin]);
        $this->assertFound($this->search(['bedrooms' => 3]), [$villa]);
        $this->assertFound($this->search(['guests' => 3, 'max_price' => 200, 'types' => ['villa', 'cabin']]), [$cabin]);
    }

    public function test_pets_show_only_listings_that_allow_pets(): void
    {
        $petFriendly = $this->listing(['pets_allowed' => true]);
        $noPets = $this->listing(['pets_allowed' => false]);

        $this->assertFound($this->search(), [$petFriendly, $noPets]);
        $this->assertFound($this->search(['pets' => 0]), [$petFriendly, $noPets]);
        $this->assertFound($this->search(['pets' => 2]), [$petFriendly]);
        $this->search(['pets' => 6])->assertJsonValidationErrors('pets');
    }

    public function test_host_can_set_pets_allowed_on_a_listing(): void
    {
        $listing = $this->listing(['pets_allowed' => false]);
        Sanctum::actingAs($listing->host);

        $this->putJson("/api/properties/{$listing->id}", ['pets_allowed' => true])
            ->assertOk()
            ->assertJsonPath('pets_allowed', true);
    }

    public function test_amenities_filter_requires_every_selected_amenity(): void
    {
        $wifi = Amenity::factory()->create(['name' => 'Wi-Fi']);
        $pool = Amenity::factory()->create(['name' => 'Pool']);

        $both = $this->listing();
        $both->amenities()->attach([$wifi->id, $pool->id]);
        $wifiOnly = $this->listing();
        $wifiOnly->amenities()->attach($wifi);
        $this->listing();

        $this->assertFound($this->search(['amenities' => [$wifi->id]]), [$both, $wifiOnly]);
        $this->assertFound($this->search(['amenities' => [$wifi->id, $pool->id]]), [$both]);
    }

    public function test_invalid_filters_are_rejected(): void
    {
        $this->search(['check_in' => '2027-03-10'])->assertJsonValidationErrors('check_out');
        $this->search(['check_in' => '2027-03-10', 'check_out' => '2027-03-10'])->assertJsonValidationErrors('check_out');
        $this->search(['check_in' => '2027-02-01', 'check_out' => '2027-02-05'])->assertJsonValidationErrors('check_in');
        $this->search(['min_price' => 200, 'max_price' => 100])->assertJsonValidationErrors('max_price');
        $this->search(['types' => ['castle']])->assertJsonValidationErrors('types.0');
        $this->search(['guests' => 0])->assertJsonValidationErrors('guests');
        $this->search(['amenities' => [999]])->assertJsonValidationErrors('amenities.0');
        $this->search(['check_in' => '2027-03-10', 'check_out' => '2027-03-12', 'flexible_days' => 5])->assertJsonValidationErrors('flexible_days');
        $this->search(['stay' => 'year'])->assertJsonValidationErrors('stay');
        $this->search(['stay' => 'week', 'check_in' => '2027-03-10', 'check_out' => '2027-03-12'])->assertJsonValidationErrors('stay');
        $this->search(['stay' => 'week', 'months' => ['March']])->assertJsonValidationErrors('months.0');
    }

    public function test_amenities_endpoint_lists_all_amenities_by_name(): void
    {
        Amenity::factory()->create(['name' => 'Wi-Fi']);
        Amenity::factory()->create(['name' => 'Kitchen']);

        $this->getJson('/api/amenities')
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonPath('0.name', 'Kitchen')
            ->assertJsonPath('1.name', 'Wi-Fi');
    }
}
