<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Private view of a user: only for the user themselves and for admins.
 * For other people's profiles use PublicUserResource.
 *
 * @mixin User
 */
class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'birth_date' => $this->birth_date?->toDateString(),
            'email' => $this->email,
            'phone' => $this->phone,
            'avatar_url' => $this->avatar_url,
            'role' => $this->role,
            'created_at' => $this->created_at,
            'deleted_at' => $this->when((bool) $request->user()?->isAdmin(), $this->deleted_at),
        ];
    }
}
