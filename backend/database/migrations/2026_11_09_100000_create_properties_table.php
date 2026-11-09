<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('properties', function (Blueprint $table) {
            $table->id();
            $table->foreignId('host_id')->constrained('users')->restrictOnDelete();
            $table->string('title');
            $table->text('description');
            // Validated in PHP by App\Enums\PropertyType (string column so new types need no migration)
            $table->string('property_type', 50);
            $table->string('country', 100);
            $table->string('city', 100);
            $table->string('address');
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->decimal('price_per_night', 10, 2);
            $table->unsignedSmallInteger('max_guests');
            $table->unsignedSmallInteger('bedrooms')->default(1);
            $table->unsignedSmallInteger('beds')->default(1);
            $table->decimal('bathrooms', 3, 1)->default(1); // allows 1.5 baths
            $table->enum('status', ['draft', 'published', 'inactive'])->default('draft');
            $table->timestamps();
            // Soft delete: a listing with bookings must keep its history.
            $table->softDeletes();

            $table->index(['country', 'city']);
            $table->index('status');
            $table->index('price_per_night');
        });

        if (in_array(DB::getDriverName(), ['mysql', 'mariadb'])) {
            DB::statement('ALTER TABLE properties
                ADD CONSTRAINT chk_properties_price CHECK (price_per_night > 0),
                ADD CONSTRAINT chk_properties_max_guests CHECK (max_guests > 0),
                ADD CONSTRAINT chk_properties_bathrooms CHECK (bathrooms >= 0),
                ADD CONSTRAINT chk_properties_latitude CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
                ADD CONSTRAINT chk_properties_longitude CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('properties');
    }
};
