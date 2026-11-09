<?php

namespace App\Enums;

enum BookingStatus: string
{
    case Pending = 'pending';       // waiting for the host
    case Confirmed = 'confirmed';   // accepted by the host
    case Rejected = 'rejected';     // declined by the host
    case Cancelled = 'cancelled';   // cancelled by guest or host
    case Completed = 'completed';   // stay is over (reviews allowed)

    /**
     * Statuses that occupy the property's calendar.
     *
     * @return list<self>
     */
    public static function blocksDates(): array
    {
        return [self::Pending, self::Confirmed];
    }
}
