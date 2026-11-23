<?php

use App\Enums\BookingStatus;
use App\Models\Booking;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Confirmed stays whose check-out day has passed become "completed" (reviews are allowed after that).
// Runs daily via the scheduler; can also be run by hand: php artisan bookings:complete
Artisan::command('bookings:complete', function () {
    $count = Booking::query()
        ->where('status', BookingStatus::Confirmed)
        ->where('check_out', '<=', now()->toDateString())
        ->update(['status' => BookingStatus::Completed]);

    $this->info("{$count} booking(s) marked as completed.");
})->purpose('Mark finished confirmed bookings as completed');

Schedule::command('bookings:complete')->dailyAt('00:10');
