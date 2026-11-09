<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // check_in inclusive, check_out exclusive (guest leaves that morning, next guest can arrive the same day).
    // Number of nights is computed by the Booking model (check_out - check_in), not stored.
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->constrained()->restrictOnDelete();
            $table->foreignId('guest_id')->constrained('users')->restrictOnDelete();
            $table->date('check_in');
            $table->date('check_out');
            $table->unsignedSmallInteger('guests');
            // Snapshot of the nightly price at booking time (host may change the listing price later)
            $table->decimal('price_per_night', 10, 2);
            $table->decimal('total_price', 10, 2);
            $table->enum('status', ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'])->default('pending');
            $table->timestamps();

            $table->index(['property_id', 'check_in', 'check_out'], 'idx_bookings_dates');
            $table->index('status');
        });

        if (in_array(DB::getDriverName(), ['mysql', 'mariadb'])) {
            DB::statement('ALTER TABLE bookings
                ADD CONSTRAINT chk_bookings_dates CHECK (check_out > check_in),
                ADD CONSTRAINT chk_bookings_guests CHECK (guests > 0),
                ADD CONSTRAINT chk_bookings_price_per_night CHECK (price_per_night >= 0),
                ADD CONSTRAINT chk_bookings_total_price CHECK (total_price >= 0)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
