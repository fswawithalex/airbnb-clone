<?php

namespace Tests\Feature\Bookings;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Property;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Host side: list requests on my listings, accept / decline / cancel. */
class HostReservationTest extends TestCase
{
    use RefreshDatabase;

    private User $host;

    private Property $property;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2027-03-01 12:00:00');

        $this->host = User::factory()->host()->create();
        $this->property = Property::factory()->for($this->host, 'host')->create();
    }

    public function test_guests_cannot_open_host_reservations(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/host/reservations')->assertForbidden();
    }

    public function test_host_sees_only_reservations_on_own_listings(): void
    {
        $mine = Booking::factory()->for($this->property)->pending()->create();
        Booking::factory()->pending()->create(); // another host's listing
        Sanctum::actingAs($this->host);

        $this->getJson('/api/host/reservations')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $mine->id)
            ->assertJsonPath('data.0.guest.id', $mine->guest_id)
            ->assertJsonMissingPath('data.0.guest.email')
            ->assertJsonPath('pending_count', 1);
    }

    public function test_host_can_accept_a_request(): void
    {
        $booking = Booking::factory()->for($this->property)->pending()->create();
        Sanctum::actingAs($this->host);

        $this->postJson("/api/host/reservations/{$booking->id}/approve")
            ->assertOk()
            ->assertJsonPath('booking.status', 'confirmed');
    }

    public function test_cannot_accept_two_overlapping_requests(): void
    {
        $first = Booking::factory()->for($this->property)->pending()->between('2027-03-10', '2027-03-15')->create();
        $second = Booking::factory()->for($this->property)->pending()->between('2027-03-12', '2027-03-14')->create();
        Sanctum::actingAs($this->host);

        $this->postJson("/api/host/reservations/{$first->id}/approve")->assertOk();
        $this->postJson("/api/host/reservations/{$second->id}/approve")->assertUnprocessable();
    }

    public function test_host_can_decline_a_request(): void
    {
        $booking = Booking::factory()->for($this->property)->pending()->create();
        $booking->payments()->create(['amount' => $booking->total_price]);
        Sanctum::actingAs($this->host);

        $this->postJson("/api/host/reservations/{$booking->id}/reject")
            ->assertOk()
            ->assertJsonPath('booking.status', 'rejected')
            ->assertJsonPath('booking.payments.0.status', 'failed');

        $this->postJson("/api/host/reservations/{$booking->id}/approve")->assertUnprocessable();
    }

    public function test_host_can_cancel_an_accepted_stay_before_check_in(): void
    {
        $booking = Booking::factory()->for($this->property)->between('2027-03-10', '2027-03-12')->create();
        Sanctum::actingAs($this->host);

        $this->postJson("/api/host/reservations/{$booking->id}/cancel")
            ->assertOk()
            ->assertJsonPath('booking.status', 'cancelled');
    }

    public function test_host_cannot_touch_other_hosts_reservations(): void
    {
        $booking = Booking::factory()->pending()->create();
        Sanctum::actingAs($this->host);

        $this->postJson("/api/host/reservations/{$booking->id}/approve")->assertNotFound();
        $this->assertSame(BookingStatus::Pending, $booking->fresh()->status);
    }
}
