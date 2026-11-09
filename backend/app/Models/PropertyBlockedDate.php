<?php

namespace App\Models;

use Database\Factories\PropertyBlockedDateFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** start_date inclusive, end_date exclusive (same as bookings). */
#[Fillable(['start_date', 'end_date', 'reason'])]
class PropertyBlockedDate extends Model
{
    /** @use HasFactory<PropertyBlockedDateFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }
}
