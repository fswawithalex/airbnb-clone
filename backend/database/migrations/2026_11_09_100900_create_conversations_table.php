<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // One message thread per guest per listing. host_id is copied from the property
    // so a host's inbox is a simple WHERE host_id = ? query.
    // updated_at is bumped on every new message (Message::$touches) -> sort inbox by it.
    public function up(): void
    {
        Schema::create('conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->constrained()->cascadeOnDelete();
            $table->foreignId('guest_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('host_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['property_id', 'guest_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conversations');
    }
};
