// Date helpers for the search bar's "When" panel. Days are "YYYY-MM-DD" strings, months "YYYY-MM".
import { toISODate } from './booking.js'
import { countLabel } from './listing.js'

const asDate = (iso) => new Date(`${iso}T00:00:00`)

export const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1)

/** 0 = Sunday-first weeks (English, like Airbnb US), 1 = Monday-first (Romanian, Russian). */
export const weekStartsOn = (locale) => (locale === 'en' ? 0 : 1)

/** Narrow weekday names in display order: S M T W T F S / L M M J V S D / П В С Ч П С В. */
export function weekdayNames(locale) {
  const format = new Intl.DateTimeFormat(locale, { weekday: 'narrow' })
  const start = weekStartsOn(locale)
  // 4 Jan 1970 was a Sunday
  return Array.from({ length: 7 }, (_, i) => format.format(new Date(1970, 0, 4 + ((start + i) % 7))))
}

/** One month as calendar cells: null for the blanks before day 1, then every day. `month` is 0-based. */
export function monthCells(year, month, locale) {
  const lead = (new Date(year, month, 1).getDay() - weekStartsOn(locale) + 7) % 7
  const days = new Date(year, month + 1, 0).getDate()
  return [
    ...Array(lead).fill(null),
    ...Array.from({ length: days }, (_, i) => toISODate(new Date(year, month, i + 1))),
  ]
}

/** "November 2026" / "Noiembrie 2026" / "Ноябрь 2026 г." */
export function monthTitle(year, month, locale) {
  return capitalize(new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(year, month, 1)))
}

/** "December" / "Decembrie" / "Декабрь" */
export function monthName(year, month, locale) {
  return capitalize(new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(year, month, 1)))
}

/** The current month and the next ones: [{ value: '2026-11', year: 2026, month: 10 }, …] */
export function upcomingMonths(count, today = new Date()) {
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(today.getFullYear(), today.getMonth() + i, 1)
    return {
      value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      year: date.getFullYear(),
      month: date.getMonth(),
    }
  })
}

/** "2026-12" -> "Dec" / "dec." / "дек." */
export function shortMonth(value, locale) {
  const [year, month] = value.split('-').map(Number)
  return new Intl.DateTimeFormat(locale, { month: 'short' }).format(new Date(year, month - 1, 1))
}

/** "Sunday, 1 December 2026" for screen readers. */
export function longDay(iso, locale) {
  return new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(asDate(iso))
}

/** URL search object -> the shape whenLabel() and the When panel use. */
export function whenFromSearch(search) {
  return {
    mode: search.stay ? 'flexible' : 'dates',
    check_in: search.check_in ?? '',
    check_out: search.check_out ?? '',
    flexible_days: Number(search.flexible_days) || 0,
    stay: search.stay || 'week',
    months: search.months ?? [],
  }
}

/**
 * Text shown in the bar's "When" box ('' = nothing chosen yet):
 * "Dec 1 – 5 ± 2", "Dec 1 – ", "Week · Dec, Jan", "Weekend · anytime".
 */
export function whenLabel(when, t, locale) {
  if (when.mode === 'flexible') {
    const months = when.months.map((value) => shortMonth(value, locale)).join(', ')
    return `${t(`search.stay_${when.stay}`)} · ${months || t('search.flexAnytime')}`
  }
  if (!when.check_in) return ''

  const format = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' })
  if (!when.check_out) return `${format.format(asDate(when.check_in))} – `
  const range = format.formatRange(asDate(when.check_in), asDate(when.check_out))
  return when.flexible_days ? `${range} ± ${countLabel(t, locale, 'search.days', when.flexible_days)}` : range
}
