<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * "Services" tab on the homepage: something a host does for the guest during the stay
 * (private chef, photo shoot, massage...). Same shape as experiences: priced per guest, per session.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('host_id')->constrained('users')->restrictOnDelete();
            $table->string('title');
            $table->text('description');
            // Validated in PHP by App\Enums\ServiceCategory
            $table->string('category', 50);
            $table->string('country', 100);
            $table->string('city', 100);
            $table->decimal('price', 10, 2); // per guest
            $table->unsignedSmallInteger('duration_minutes');
            $table->unsignedSmallInteger('max_guests');
            $table->string('image_url')->nullable(); // none = the frontend shows the category icon
            $table->enum('status', ['draft', 'published', 'inactive'])->default('draft');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['country', 'city']);
            $table->index('status');
        });

        if (in_array(DB::getDriverName(), ['mysql', 'mariadb'])) {
            DB::statement('ALTER TABLE services
                ADD CONSTRAINT chk_services_price CHECK (price > 0),
                ADD CONSTRAINT chk_services_duration CHECK (duration_minutes > 0),
                ADD CONSTRAINT chk_services_max_guests CHECK (max_guests > 0)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};
