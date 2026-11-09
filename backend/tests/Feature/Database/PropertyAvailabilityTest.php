<?php

namespace Tests\Feature\Database;

use App\Models\Booking;
use App\Models\Property;
use App\Models\PropertyBlockedDate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Date rule: check_in / start_date inclusive, check_out / end_date exclusive.
 * Existing stay 10 -> 15 March (confirmed), cancelled stay 20 -> 25 March, host block 1 -> 5 April.
 */
class PropertyAvailabilityTest extends TestCase
{
    use RefreshDatabase;

    public static function stays(): array
    {
        return [
            'arrive on the previous guest\'s check-out day' => ['2027-03-15', '2027-03-18', true],
            'leave on the next guest\'s check-in day' => ['2027-03-05', '2027-03-10', true],
            'inside an existing stay' => ['2027-03-12', '2027-03-14', false],
            'overlapping the start of a stay' => ['2027-03-08', '2027-03-11', false],
            'covering a whole stay' => ['2027-03-01', '2027-03-31', false],
            'cancelled bookings do not block' => ['2027-03-20', '2027-03-25', true],
            'host-blocked dates block' => ['2027-04-03', '2027-04-06', false],
            'right after a host block' => ['2027-04-05', '2027-04-07', true],
        ];
    }

    #[DataProvider('stays')]
    public function test_available_between(string $checkIn, string $checkOut, bool $expected): void
    {
        $property = Property::factory()->create();
        Booking::factory()->for($property)->between('2027-03-10', '2027-03-15')->create();
        Booking::factory()->for($property)->cancelled()->between('2027-03-20', '2027-03-25')->create();
        PropertyBlockedDate::factory()->for($property)->create(['start_date' => '2027-04-01', 'end_date' => '2027-04-05']);

        $available = Property::availableBetween($checkIn, $checkOut)->whereKey($property->id)->exists();

        $this->assertSame($expected, $available);
    }

    public function test_booking_nights_are_computed_from_dates(): void
    {
        $booking = Booking::factory()->between('2027-03-10', '2027-03-15')->create();

        $this->assertSame(5, $booking->fresh()->nights);
        $this->assertEquals($booking->price_per_night * 5, $booking->total_price);
    }
}
