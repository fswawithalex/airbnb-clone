<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Dates a host closed on the calendar without a booking (maintenance, personal use...).
    // Same semantics as bookings: start_date inclusive, end_date exclusive.
    public function up(): void
    {
        Schema::create('property_blocked_dates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->constrained()->cascadeOnDelete();
            $table->date('start_date');
            $table->date('end_date');
            $table->string('reason')->nullable();
            $table->timestamps();

            $table->index(['property_id', 'start_date', 'end_date'], 'idx_blocked_dates_range');
        });

        if (in_array(DB::getDriverName(), ['mysql', 'mariadb'])) {
            DB::statement('ALTER TABLE property_blocked_dates
                ADD CONSTRAINT chk_blocked_dates_range CHECK (end_date > start_date)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('property_blocked_dates');
    }
};
