<?php

namespace App\Models;

use App\Enums\ExperienceCategory;
use App\Models\Concerns\IsOffering;
use Database\Factories\ExperienceFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/** An activity run by a host (cooking class, city tour...). Create through $user->experiences()->create($data). */
#[Fillable([
    'title', 'description', 'category', 'country', 'city', 'price', 'duration_minutes', 'max_guests', 'image_url', 'status',
])]
class Experience extends Model
{
    /** @use HasFactory<ExperienceFactory> */
    use HasFactory, IsOffering, SoftDeletes;

    protected $attributes = [
        'status' => 'draft',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['category' => ExperienceCategory::class, ...$this->offeringCasts()];
    }
}
