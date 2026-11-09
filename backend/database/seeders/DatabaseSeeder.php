<?php

namespace Database\Seeders;

use App\Enums\BookingStatus;
use App\Models\Amenity;
use App\Models\Booking;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Payment;
use App\Models\Property;
use App\Models\PropertyBlockedDate;
use App\Models\PropertyImage;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * Demo data for local development:  php artisan migrate:fresh --seed
 *
 * Logins (password "password"):
 *   admin@example.com  - admin
 *   host@example.com   - host with 4 published listings + 1 draft
 *   guest@example.com  - guest with a past stay, an upcoming stay and a conversation
 */
class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->call(AmenitySeeder::class);
        $amenities = Amenity::all();

        User::factory()->admin()->create(['name' => 'Demo Admin', 'email' => 'admin@example.com']);
        $demoHost = User::factory()->host()->create(['name' => 'Demo Host', 'email' => 'host@example.com']);
        $demoGuest = User::factory()->create(['name' => 'Demo Guest', 'email' => 'guest@example.com']);

        $hosts = User::factory(2)->host()->create()->prepend($demoHost);
        $guests = User::factory(9)->create()->prepend($demoGuest);

        // 4 published listings per host (the first 4 belong to the demo host)
        $published = $hosts->flatMap(fn (User $host) => Property::factory(4)->for($host, 'host')->create());
        $draft = Property::factory()->draft()->for($demoHost, 'host')->create();

        foreach ($published->concat([$draft]) as $property) {
            $this->seedImages($property);
            $property->amenities()->attach($amenities->random(fake()->numberBetween(4, 8))->pluck('id'));
        }

        foreach ($published->values() as $index => $property) {
            // The demo guest gets stays in the demo host's first two listings
            $this->seedBookings($property, $guests, $index < 2 ? $demoGuest : null);

            if ($index % 2 === 0) {
                PropertyBlockedDate::factory()->for($property)->create([
                    'start_date' => today()->addDays(60),
                    'end_date' => today()->addDays(63),
                    'reason' => 'Maintenance',
                ]);
            }
        }

        foreach ($guests as $guest) {
            $guest->favorites()->attach($published->random(3)->pluck('id'));
        }

        $this->seedConversations($published, $guests, $demoGuest);
    }

    private function seedImages(Property $property): void
    {
        foreach (range(0, 3) as $position) {
            PropertyImage::factory()->for($property)->create([
                'is_primary' => $position === 0,
                'sort_order' => $position,
            ]);
        }
    }

    /**
     * Non-overlapping timeline per listing: 2 completed stays (paid + reviewed) in the past,
     * 1 confirmed upcoming stay (paid), 1 pending request and 1 cancelled request.
     */
    private function seedBookings(Property $property, Collection $guests, ?User $demoGuest): void
    {
        $cursor = today()->subDays(90);

        foreach (range(0, 1) as $i) {
            $checkIn = $cursor->copy()->addDays(fake()->numberBetween(0, 10));
            $checkOut = $checkIn->copy()->addDays(fake()->numberBetween(2, 5));
            $cursor = $checkOut->copy()->addDays(fake()->numberBetween(3, 10));

            $guest = $i === 0 && $demoGuest ? $demoGuest : $guests->random();
            $booking = $this->book($property, $guest, $checkIn, $checkOut, BookingStatus::Completed);
            Payment::factory()->for($booking)->create(['created_at' => $checkIn->copy()->subDays(14)]);
            Review::factory()->for($booking)->create(['created_at' => $checkOut->copy()->addDay()]);
        }

        $checkIn = today()->addDays(fake()->numberBetween(7, 25));
        $upcoming = $this->book($property, $demoGuest ?? $guests->random(), $checkIn, $checkIn->copy()->addDays(fake()->numberBetween(2, 6)), BookingStatus::Confirmed);
        Payment::factory()->for($upcoming)->create();

        $checkIn = today()->addDays(fake()->numberBetween(35, 45));
        $this->book($property, $guests->random(), $checkIn, $checkIn->copy()->addDays(fake()->numberBetween(2, 4)), BookingStatus::Pending);

        $checkIn = today()->addDays(70);
        $this->book($property, $guests->random(), $checkIn, $checkIn->copy()->addDays(3), BookingStatus::Cancelled);
    }

    private function book(Property $property, User $guest, Carbon $checkIn, Carbon $checkOut, BookingStatus $status): Booking
    {
        return Booking::factory()
            ->for($property)
            ->for($guest, 'guest')
            ->between($checkIn, $checkOut)
            ->create([
                'guests' => fake()->numberBetween(1, $property->max_guests),
                'status' => $status,
            ]);
    }

    private function seedConversations(Collection $published, Collection $guests, User $demoGuest): void
    {
        // Demo guest <-> demo host about the demo host's first listing
        $this->conversation($published->first(), $demoGuest, [
            'Hi! Is the apartment suitable for working remotely? How fast is the Wi-Fi?',
            'Hello! Yes, there is a desk and fibre internet (around 300 Mbps).',
            'Great, and is early check-in possible?',
            'If the previous guest leaves on time, you can check in from 12:00.',
        ]);

        // A few random threads on other hosts' listings (distinct listings -> unique per guest+listing)
        $published->slice(4)->random(3)->values()->each(function (Property $property, int $i) use ($guests) {
            $this->conversation($property, $guests[$i + 1], [
                'Hello, is parking available nearby?',
                'Yes, there is free street parking right in front of the building.',
            ]);
        });
    }

    /** Messages alternate guest -> host -> guest... */
    private function conversation(Property $property, User $guest, array $bodies): void
    {
        $conversation = Conversation::factory()->for($property)->for($guest, 'guest')->create();
        $start = now()->subDays(3);

        foreach ($bodies as $i => $body) {
            Message::factory()->for($conversation)->create([
                'sender_id' => $i % 2 === 0 ? $guest->id : $property->host_id,
                'body' => $body,
                'read_at' => $i < count($bodies) - 1 ? $start->copy()->addHours($i * 2 + 1) : null,
                'created_at' => $start->copy()->addHours($i * 2),
            ]);
        }
    }
}
