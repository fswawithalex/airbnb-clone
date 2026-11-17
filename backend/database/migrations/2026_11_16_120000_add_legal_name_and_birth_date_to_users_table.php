<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Airbnb-style sign up: first name, last name (as on the ID) and birth date (18+).
 * users.name stays and is kept in sync by the User model ("first last"),
 * so existing code that reads ->name keeps working.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('first_name', 50)->nullable()->after('name');
            $table->string('last_name', 50)->nullable()->after('first_name');
            $table->date('birth_date')->nullable()->after('last_name');
        });

        // Existing rows: first word = first name, the rest = last name
        DB::table('users')->whereNull('first_name')->orderBy('id')->each(function ($user) {
            $parts = preg_split('/\s+/', trim($user->name), 2);
            DB::table('users')->where('id', $user->id)->update([
                'first_name' => mb_substr($parts[0] ?? '', 0, 50),
                'last_name' => mb_substr($parts[1] ?? '', 0, 50) ?: null,
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['first_name', 'last_name', 'birth_date']);
        });
    }
};
