<?php

namespace Tests\Feature\Database;

use App\Models\Booking;
use App\Models\Property;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The database itself rejects invalid data, even if a controller forgets to validate.
 */
class ConstraintsTest extends TestCase
{
    use RefreshDatabase;

    public function test_booking_check_out_must_be_after_check_in(): void
    {
        $this->expectException(QueryException::class);

        Booking::factory()->between('2027-03-10', '2027-03-10')->create();
    }

    public function test_booking_needs_at_least_one_guest(): void
    {
        $this->expectException(QueryException::class);

        Booking::factory()->create(['guests' => 0]);
    }

    public function test_property_price_must_be_positive(): void
    {
        $this->expectException(QueryException::class);

        Property::factory()->create(['price_per_night' => 0]);
    }

    public function test_review_rating_must_be_between_1_and_5(): void
    {
        $this->expectException(QueryException::class);

        Review::factory()->create(['rating' => 6]);
    }

    public function test_only_one_review_per_booking(): void
    {
        $review = Review::factory()->create();

        $this->expectException(QueryException::class);

        Review::factory()->for($review->booking)->create();
    }

    public function test_a_property_can_be_favorited_once_per_user(): void
    {
        $user = User::factory()->create();
        $property = Property::factory()->create();
        $user->favorites()->attach($property);

        $this->expectException(QueryException::class);

        $user->favorites()->attach($property);
    }

    public function test_users_with_bookings_are_soft_deleted_and_keep_history(): void
    {
        $booking = Booking::factory()->create();
        $guest = $booking->guest;

        $guest->delete();

        $this->assertSoftDeleted($guest);
        $this->assertModelExists($booking);

        // A hard delete is blocked by the foreign key (RESTRICT)
        $this->expectException(QueryException::class);
        $guest->forceDelete();
    }
}
