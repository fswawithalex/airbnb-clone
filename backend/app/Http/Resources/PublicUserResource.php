<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * What anyone may see about a user (host page, review author). No email, phone, last name or birth date.
 *
 * @mixin User
 */
class PublicUserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            // Like Airbnb: only the first name is public
            'name' => $this->first_name ?: $this->name,
            'avatar_url' => $this->avatar_url,
            'role' => $this->role,
            'member_since' => $this->created_at,
            'listings_count' => $this->whenCounted('properties'),
            'reviews_count' => $this->whenCounted('reviews'),
        ];
    }
}
