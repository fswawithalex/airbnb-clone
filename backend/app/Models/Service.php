<?php

namespace App\Models;

use App\Enums\ServiceCategory;
use App\Models\Concerns\IsOffering;
use Database\Factories\ServiceFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/** Something a host does for guests (private chef, photo shoot...). Create through $user->services()->create($data). */
#[Fillable([
    'title', 'description', 'category', 'country', 'city', 'price', 'duration_minutes', 'max_guests', 'image_url', 'status',
])]
class Service extends Model
{
    /** @use HasFactory<ServiceFactory> */
    use HasFactory, IsOffering, SoftDeletes;

    protected $attributes = [
        'status' => 'draft',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['category' => ServiceCategory::class, ...$this->offeringCasts()];
    }
}
