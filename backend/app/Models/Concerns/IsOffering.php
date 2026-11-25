<?php

namespace App\Models\Concerns;

use App\Enums\PropertyStatus;
use App\Models\User;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Shared by Experience and Service (same columns): the host, the "published" filter and the homepage search.
 */
trait IsOffering
{
    public function host(): BelongsTo
    {
        return $this->belongsTo(User::class, 'host_id');
    }

    #[Scope]
    protected function published(Builder $query): void
    {
        $query->where('status', PropertyStatus::Published);
    }

    /** Homepage search bar: "Where" matches city, country or title; "Who" needs enough places. */
    #[Scope]
    protected function search(Builder $query, ?string $location, ?int $guests): void
    {
        $query
            ->when($location, function (Builder $query, string $location) {
                $like = '%'.addcslashes($location, '%_\\').'%';
                $query->where(fn (Builder $q) => $q
                    ->where('city', 'like', $like)
                    ->orWhere('country', 'like', $like)
                    ->orWhere('title', 'like', $like));
            })
            ->when($guests, fn (Builder $query, int $guests) => $query->where('max_guests', '>=', $guests));
    }

    /** @return array<string, string> */
    protected function offeringCasts(): array
    {
        return [
            'status' => PropertyStatus::class, // same draft / published / inactive values
            'price' => 'decimal:2',
            'duration_minutes' => 'integer',
            'max_guests' => 'integer',
        ];
    }
}
