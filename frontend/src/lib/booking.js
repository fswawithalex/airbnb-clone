// Helpers shared by the booking pages (guest trips + host reservations).
// Dates are plain "YYYY-MM-DD" strings everywhere (check_in inclusive, check_out exclusive).

export const CURRENCY = 'EUR'

/** Date -> "YYYY-MM-DD" in local time. */
export function toISODate(date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}

export function addDays(iso, days) {
  const date = new Date(`${iso}T00:00:00`)
  date.setDate(date.getDate() + days)
  return toISODate(date)
}

/** Whole nights between two "YYYY-MM-DD" dates (0 if the range is invalid). */
export function nightsBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut || checkOut <= checkIn) return 0
  const utc = (iso) => {
    const [y, m, d] = iso.split('-').map(Number)
    return Date.UTC(y, m - 1, d)
  }
  return Math.round((utc(checkOut) - utc(checkIn)) / 86_400_000)
}

/** Two [start, end) ranges overlap when a.start < b.end && a.end > b.start. */
export function overlapsAny(checkIn, checkOut, ranges = []) {
  return ranges.some((range) => checkIn < range.end && checkOut > range.start)
}

export function formatMoney(amount, locale = 'en', currency = CURRENCY) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 2 }).format(Number(amount ?? 0))
}

/** "2027-03-10" -> "Mar 10, 2027" without time-zone shifts. */
export function formatDay(iso, locale = 'en', options = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat(locale, { timeZone: 'UTC', ...options }).format(new Date(`${iso.slice(0, 10)}T00:00:00Z`))
}

export function isPaid(booking) {
  return (booking?.payments ?? []).some((payment) => payment.status === 'paid')
}

/** Mirrors Booking::isCancellable() on the backend. */
export function canGuestCancel(booking, today = toISODate(new Date())) {
  return ['pending', 'confirmed'].includes(booking?.status) && booking.check_in > today
}

export function canPay(booking) {
  return booking?.status === 'confirmed' && !isPaid(booking)
}

/** Photo of the listing, with the local fallback used on the rest of the site. */
export function propertyImage(property) {
  const url = property?.primary_image?.url
  return !url || url.includes('picsum.photos') ? `/${((property?.id ?? 0) % 5) + 1}.jpg` : url
}
