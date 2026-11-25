<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Appends;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\HasApiTokens;

// "role" is intentionally NOT fillable: a registration request must never be able to send role=admin.
#[Fillable(['name', 'first_name', 'last_name', 'birth_date', 'email', 'password', 'phone', 'avatar'])]
#[Hidden(['password', 'remember_token'])]
#[Appends(['avatar_url'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $attributes = [
        'role' => 'guest',
    ];

    protected static function booted(): void
    {
        // users.name is the display name used everywhere: keep it equal to "first last".
        static::saving(function (User $user) {
            if ($user->isDirty(['first_name', 'last_name']) && $user->first_name) {
                $user->name = trim($user->first_name.' '.$user->last_name);
            }
        });
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'birth_date' => 'date:Y-m-d',
            'password' => 'hashed',
            'role' => UserRole::class,
        ];
    }

    /** Full URL of the avatar (uploaded file on the public disk or an external URL), or null. */
    protected function avatarUrl(): Attribute
    {
        return Attribute::get(function () {
            $avatar = $this->attributes['avatar'] ?? null;

            if (! $avatar) {
                return null;
            }

            return str_starts_with($avatar, 'http') ? $avatar : Storage::disk('public')->url($avatar);
        });
    }

    /** Name or email contains the text (admin search). */
    #[Scope]
    protected function search(Builder $query, string $text): void
    {
        $like = '%'.str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $text).'%';

        $query->where(fn (Builder $query) => $query
            ->where('name', 'like', $like)
            ->orWhere('email', 'like', $like));
    }

    public function isAdmin(): bool
    {
        return $this->role === UserRole::Admin;
    }

    public function isHost(): bool
    {
        return $this->role === UserRole::Host;
    }

    /** Listings this user hosts. */
    public function properties(): HasMany
    {
        return $this->hasMany(Property::class, 'host_id');
    }

    public function experiences(): HasMany
    {
        return $this->hasMany(Experience::class, 'host_id');
    }

    public function services(): HasMany
    {
        return $this->hasMany(Service::class, 'host_id');
    }

    /** Stays this user booked as a guest. */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'guest_id');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class, 'guest_id');
    }

    /** Wishlist. */
    public function favorites(): BelongsToMany
    {
        return $this->belongsToMany(Property::class, 'favorites')->withTimestamps();
    }

    public function guestConversations(): HasMany
    {
        return $this->hasMany(Conversation::class, 'guest_id');
    }

    public function hostConversations(): HasMany
    {
        return $this->hasMany(Conversation::class, 'host_id');
    }

    public function sentMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'sender_id');
    }
}
