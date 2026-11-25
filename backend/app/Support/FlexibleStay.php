<?php

namespace App\Support;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\PropertyBlockedDate;
use Illuminate\Support\Carbon;

/**
 * "Flexible" tab of the homepage search, e.g. "a week sometime in December or January".
 * Keeps the listings that have at least one free stay of that length starting in one of the chosen months.
 *
 * Runs in PHP on listings the SQL filters already narrowed down: finding a free gap is a few lines here
 * and awkward in SQL. Dates are "Y-m-d" strings (compare as text); ranges are [start, end) like bookings.
 */
final class FlexibleStay
{
    /** Nights per stay length. A weekend is Friday → Sunday. */
    public const NIGHTS = ['weekend' => 2, 'week' => 7, 'month' => 28];

    /** No month picked = "any time" in this many months, starting with the current one (same as the UI). */
    public const DEFAULT_MONTHS = 6;

    /**
     * @param  int[]  $propertyIds
     * @param  string[]  $months  "Y-m"
     * @return int[] the ids, in the same order, of listings with a free stay
     */
    public static function filter(array $propertyIds, string $stay, array $months): array
    {
        $nights = self::NIGHTS[$stay];
        $starts = self::possibleCheckIns($stay, $months);
        if ($propertyIds === [] || $starts === []) {
            return [];
        }

        $taken = self::takenRanges($propertyIds, $starts[0], self::addDays(end($starts), $nights));

        return array_values(array_filter($propertyIds, function (int $id) use ($starts, $nights, $taken) {
            foreach ($starts as $checkIn) {
                if (! self::overlapsAny($checkIn, self::addDays($checkIn, $nights), $taken[$id] ?? [])) {
                    return true;
                }
            }

            return false;
        }));
    }

    /**
     * Every day of the chosen months (only Fridays for a weekend), from today on, sorted.
     *
     * @param  string[]  $months
     * @return string[]
     */
    private static function possibleCheckIns(string $stay, array $months): array
    {
        $today = Carbon::today();
        if ($months === []) {
            $months = array_map(
                fn (int $offset) => $today->copy()->startOfMonth()->addMonthsNoOverflow($offset)->format('Y-m'),
                range(0, self::DEFAULT_MONTHS - 1),
            );
        }

        $days = [];
        foreach (array_unique($months) as $month) {
            $day = Carbon::createFromFormat('!Y-m', $month); // "!" = first day of that month, 00:00
            $lastDay = $day->copy()->endOfMonth();
            for (; $day->lte($lastDay); $day->addDay()) {
                if ($day->gte($today) && ($stay !== 'weekend' || $day->isFriday())) {
                    $days[] = $day->toDateString();
                }
            }
        }
        sort($days);

        return $days;
    }

    /**
     * Booked (pending/confirmed) and host-blocked ranges overlapping [$from, $until), per listing.
     *
     * @param  int[]  $propertyIds
     * @return array<int, list<array{0: string, 1: string}>>
     */
    private static function takenRanges(array $propertyIds, string $from, string $until): array
    {
        $taken = [];

        Booking::query()
            ->whereIn('property_id', $propertyIds)
            ->whereIn('status', BookingStatus::blocksDates())
            ->where('check_in', '<', $until)
            ->where('check_out', '>', $from)
            ->get(['property_id', 'check_in', 'check_out'])
            ->each(function (Booking $booking) use (&$taken) {
                $taken[$booking->property_id][] = [$booking->check_in->toDateString(), $booking->check_out->toDateString()];
            });

        PropertyBlockedDate::query()
            ->whereIn('property_id', $propertyIds)
            ->where('start_date', '<', $until)
            ->where('end_date', '>', $from)
            ->get(['property_id', 'start_date', 'end_date'])
            ->each(function (PropertyBlockedDate $blocked) use (&$taken) {
                $taken[$blocked->property_id][] = [$blocked->start_date->toDateString(), $blocked->end_date->toDateString()];
            });

        return $taken;
    }

    /** @param  list<array{0: string, 1: string}>  $ranges */
    private static function overlapsAny(string $start, string $end, array $ranges): bool
    {
        foreach ($ranges as [$takenStart, $takenEnd]) {
            if ($takenStart < $end && $takenEnd > $start) {
                return true;
            }
        }

        return false;
    }

    private static function addDays(string $date, int $days): string
    {
        return Carbon::parse($date)->addDays($days)->toDateString();
    }
}
