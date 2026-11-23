<?php

namespace Tests\Feature\Bookings;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Models\Booking;
use App\Models\Property;
use App\Models\PropertyBlockedDate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Guest side: book, list trips, see one, cancel, pay. */
class BookingApiTest extends TestCase
{
    use RefreshDatabase;

    private Property $property;

    private User $guest;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2027-03-01 12:00:00');

        $this->property = Property::factory()->create(['price_per_night' => 100, 'max_guests' => 4]);
        $this->guest = User::factory()->create();
    }

    private function book(array $overrides = [])
    {
        return $this->postJson('/api/bookings', [
            'property_id' => $this->property->id,
            'check_in' => '2027-03-10',
            'check_out' => '2027-03-13',
            'guests' => 2,
            ...$overrides,
        ]);
    }

    public function test_guest_can_book_and_price_is_computed_on_the_server(): void
    {
        Sanctum::actingAs($this->guest);

        $this->book()
            ->assertCreated()
            ->assertJsonPath('booking.status', 'pending')
            ->assertJsonPath('booking.nights', 3)
            ->assertJsonPath('booking.check_in', '2027-03-10')
            ->assertJsonPath('booking.total_price', '300.00')
            ->assertJsonPath('booking.payments.0.status', 'pending');
    }

    public function test_booking_requires_login(): void
    {
        $this->book()->assertUnauthorized();
    }

    public function test_host_cannot_book_own_listing(): void
    {
        Sanctum::actingAs($this->property->host);

        $this->book()->assertUnprocessable()->assertJsonValidationErrors('property_id');
    }

    public function test_cannot_book_more_guests_than_allowed(): void
    {
        Sanctum::actingAs($this->guest);

        $this->book(['guests' => 5])->assertUnprocessable()->assertJsonValidationErrors('guests');
    }

    public function test_cannot_book_draft_listing(): void
    {
        $this->property->update(['status' => 'draft']);
        Sanctum::actingAs($this->guest);

        $this->book()->assertUnprocessable()->assertJsonValidationErrors('property_id');
    }

    public function test_cannot_book_taken_or_blocked_dates(): void
    {
        Booking::factory()->for($this->property)->pending()->between('2027-03-12', '2027-03-15')->create();
        PropertyBlockedDate::factory()->for($this->property)->create(['start_date' => '2027-04-01', 'end_date' => '2027-04-05']);
        Sanctum::actingAs($this->guest);

        $this->book()->assertUnprocessable()->assertJsonValidationErrors('check_in');
        $this->book(['check_in' => '2027-04-04', 'check_out' => '2027-04-06'])->assertUnprocessable();
        // Arriving on the previous guest's check-out day is fine
        $this->book(['check_in' => '2027-03-15', 'check_out' => '2027-03-17'])->assertCreated();
    }

    public function test_cannot_book_in_the_past(): void
    {
        Sanctum::actingAs($this->guest);

        $this->book(['check_in' => '2027-02-20', 'check_out' => '2027-02-22'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('check_in');
    }

    public function test_unavailable_dates_lists_future_blocking_ranges(): void
    {
        Booking::factory()->for($this->property)->between('2027-03-10', '2027-03-15')->create();
        Booking::factory()->for($this->property)->cancelled()->between('2027-03-20', '2027-03-25')->create();
        Booking::factory()->for($this->property)->between('2027-02-01', '2027-02-05')->create(); // over
        PropertyBlockedDate::factory()->for($this->property)->create(['start_date' => '2027-04-01', 'end_date' => '2027-04-05']);

        $this->getJson("/api/properties/{$this->property->id}/unavailable-dates")
            ->assertOk()
            ->assertExactJson([
                'property_id' => $this->property->id,
                'ranges' => [
                    ['start' => '2027-03-10', 'end' => '2027-03-15'],
                    ['start' => '2027-04-01', 'end' => '2027-04-05'],
                ],
            ]);
    }

    public function test_trips_are_split_into_upcoming_past_and_cancelled(): void
    {
        $factory = Booking::factory()->for($this->guest, 'guest');
        $upcoming = $factory->for($this->property)->between('2027-03-10', '2027-03-12')->create();
        $past = $factory->for($this->property)->between('2027-02-10', '2027-02-12')->create();
        $cancelled = $factory->for($this->property)->cancelled()->between('2027-03-20', '2027-03-22')->create();
        Booking::factory()->for($this->property)->between('2027-05-01', '2027-05-03')->create(); // someone else's

        Sanctum::actingAs($this->guest);

        $this->getJson('/api/bookings')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $upcoming->id);
        $this->getJson('/api/bookings?scope=past')->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $past->id);
        $this->getJson('/api/bookings?scope=cancelled')->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $cancelled->id);
        $this->getJson('/api/bookings?scope=all')->assertJsonCount(3, 'data');
    }

    public function test_guest_cannot_see_someone_elses_booking(): void
    {
        $booking = Booking::factory()->for($this->property)->create();
        Sanctum::actingAs($this->guest);

        $this->getJson("/api/bookings/{$booking->id}")->assertNotFound();
        $this->postJson("/api/bookings/{$booking->id}/cancel")->assertNotFound();
    }

    public function test_guest_can_cancel_pending_booking_and_dates_are_freed(): void
    {
        Sanctum::actingAs($this->guest);
        $id = $this->book()->json('booking.id');

        $this->postJson("/api/bookings/{$id}/cancel")
            ->assertOk()
            ->assertJsonPath('booking.status', 'cancelled')
            ->assertJsonPath('booking.payments.0.status', 'failed');

        $this->book()->assertCreated();
    }

    public function test_cancelling_a_paid_booking_refunds_it(): void
    {
        $booking = Booking::factory()->for($this->property)->for($this->guest, 'guest')->between('2027-03-10', '2027-03-12')->create();
        $booking->payments()->create(['amount' => $booking->total_price, 'status' => PaymentStatus::Paid]);
        Sanctum::actingAs($this->guest);

        $this->postJson("/api/bookings/{$booking->id}/cancel")->assertOk();

        $this->assertSame(PaymentStatus::Refunded, $booking->payments()->first()->status);
    }

    public function test_cannot_cancel_on_or_after_check_in_day(): void
    {
        $booking = Booking::factory()->for($this->property)->for($this->guest, 'guest')->between('2027-03-01', '2027-03-04')->create();
        Sanctum::actingAs($this->guest);

        $this->postJson("/api/bookings/{$booking->id}/cancel")->assertUnprocessable();
        $this->assertSame(BookingStatus::Confirmed, $booking->fresh()->status);
    }

    public function test_guest_can_pay_only_after_host_confirms(): void
    {
        Sanctum::actingAs($this->guest);
        $id = $this->book()->json('booking.id');

        $this->postJson("/api/bookings/{$id}/pay")->assertUnprocessable();

        Booking::whereKey($id)->update(['status' => BookingStatus::Confirmed]);

        $this->postJson("/api/bookings/{$id}/pay")
            ->assertOk()
            ->assertJsonPath('booking.payments.0.status', 'paid')
            ->assertJsonCount(1, 'booking.payments');

        $this->postJson("/api/bookings/{$id}/pay")->assertUnprocessable();
    }

    public function test_complete_command_marks_finished_stays(): void
    {
        $finished = Booking::factory()->for($this->property)->between('2027-02-10', '2027-02-12')->create();
        $current = Booking::factory()->for($this->property)->between('2027-02-27', '2027-03-03')->create();

        $this->artisan('bookings:complete')->assertSuccessful();

        $this->assertSame(BookingStatus::Completed, $finished->fresh()->status);
        $this->assertSame(BookingStatus::Confirmed, $current->fresh()->status);
    }
}
