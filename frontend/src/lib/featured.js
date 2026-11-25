// The homepage rows shown on "All" before any search ("Destinations for you", "Popular homes in …",
// "Available in … this weekend"), all built from the listings the API returns.
import { addDays, toISODate } from './booking.js'

/** Seeded cities get a tile with a landmark-ish icon (no city photos yet); others get a pin. */
const CITY_STYLES = {
  Bucharest: { icon: '🏰', tint: 'from-[#FFF0D9] to-[#FFD59A]' },
  'Cluj-Napoca': { icon: '🎻', tint: 'from-[#EDE7FF] to-[#CFC2FF]' },
  Brasov: { icon: '🏔️', tint: 'from-[#E3F2FF] to-[#B3D9FF]' },
  Rome: { icon: '🏟️', tint: 'from-[#FFE7D6] to-[#FFC4A1]' },
  Barcelona: { icon: '🏖️', tint: 'from-[#FFF6CC] to-[#FFE07A]' },
  Paris: { icon: '🗼', tint: 'from-[#E6ECFF] to-[#BCCBFF]' },
  Lisbon: { icon: '🚋', tint: 'from-[#FFF1CC] to-[#FFD480]' },
  Athens: { icon: '🏛️', tint: 'from-[#E2F5FF] to-[#A8DBF5]' },
}

export function cityStyle(city) {
  return CITY_STYLES[city] ?? { icon: '📍', tint: 'from-[#F2F2F2] to-[#DDDDDD]' }
}

/** [{ city, count }] busiest city first (ties alphabetical). */
export function citiesByCount(properties) {
  const counts = new Map()
  for (const { city } of properties) counts.set(city, (counts.get(city) ?? 0) + 1)
  return [...counts]
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city))
}

/**
 * Friday → Sunday of the coming weekend, as dates for the search.
 * Monday–Friday it is "this weekend"; on Saturday and Sunday the next one.
 */
export function upcomingWeekend(today = new Date()) {
  const day = today.getDay() // 0 = Sunday … 6 = Saturday
  const checkIn = addDays(toISODate(today), (5 - day + 7) % 7)
  return { check_in: checkIn, check_out: addDays(checkIn, 2), thisWeek: day >= 1 && day <= 5 }
}
