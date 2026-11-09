<?php

namespace Tests\Feature\Database;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Enums\UserRole;
use App\Models\Booking;
use App\Models\Property;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DatabaseSeederTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed inside this test's transaction (rolled back afterwards). The $seed property
        // would only seed if this class happened to be the first to migrate the test DB.
        $this->seed();
    }

    public function test_demo_accounts_exist_with_their_roles(): void
    {
        $this->assertSame(UserRole::Admin, User::where('email', 'admin@example.com')->sole()->role);
        $this->assertSame(UserRole::Host, User::where('email', 'host@example.com')->sole()->role);
        $this->assertSame(UserRole::Guest, User::where('email', 'guest@example.com')->sole()->role);

        $host = User::where('email', 'host@example.com')->sole();
        $this->assertCount(5, $host->properties); // 4 published + 1 draft

        $guest = User::where('email', 'guest@example.com')->sole();
        $this->assertTrue($guest->bookings()->where('status', BookingStatus::Completed)->exists());
        $this->assertTrue($guest->bookings()->where('status', BookingStatus::Confirmed)->exists());
        $this->assertTrue($guest->guestConversations()->has('messages')->exists());
    }

    public function test_every_listing_has_a_primary_image_and_amenities(): void
    {
        Property::with(['images', 'primaryImage', 'amenities'])->get()->each(function (Property $property) {
            $this->assertCount(4, $property->images);
            $this->assertNotNull($property->primaryImage);
            $this->assertGreaterThanOrEqual(4, $property->amenities->count());
        });
    }

    public function test_completed_bookings_are_paid_and_reviewed_consistently(): void
    {
        Booking::where('status', BookingStatus::Completed)->with(['review', 'payments'])->get()
            ->each(function (Booking $booking) {
                $this->assertSame(PaymentStatus::Paid, $booking->payments->first()?->status);
                $this->assertEquals($booking->total_price, $booking->payments->first()->amount);
                $this->assertInstanceOf(Review::class, $booking->review);
                $this->assertSame($booking->guest_id, $booking->review->guest_id);
                $this->assertSame($booking->property_id, $booking->review->property_id);
            });
    }

    public function test_seeded_active_bookings_never_overlap(): void
    {
        $overlaps = DB::table('bookings as a')
            ->join('bookings as b', function ($join) {
                $join->on('a.property_id', '=', 'b.property_id')
                    ->whereColumn('a.id', '<', 'b.id')
                    ->whereColumn('a.check_in', '<', 'b.check_out')
                    ->whereColumn('a.check_out', '>', 'b.check_in');
            })
            ->whereIn('a.status', ['pending', 'confirmed'])
            ->whereIn('b.status', ['pending', 'confirmed'])
            ->count();

        $this->assertSame(0, $overlaps);
    }
}
