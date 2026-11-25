import { useState } from 'react'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { longDay, monthCells, monthTitle, weekdayNames } from '../../lib/calendar.js'
import { todayISO } from '../../lib/dates.js'

/** How far ahead the arrows go (the first visible month can be at most this many months away). */
const MAX_OFFSET = 11

/**
 * Two months side by side (one on phones), Airbnb style: first click = check-in, second click = checkout,
 * hovering previews the range. Past days are disabled.
 */
export default function DateRangeCalendar({ checkIn, checkOut, onChange }) {
  const { t, locale } = useI18n()
  const today = todayISO()
  const [thisYear, thisMonth] = today.split('-').map(Number)
  const monthsAway = (iso) => {
    const [year, month] = iso.split('-').map(Number)
    return (year - thisYear) * 12 + month - thisMonth
  }

  // Open on the month of the chosen check-in, if any
  const [offset, setOffset] = useState(() => (checkIn ? Math.min(Math.max(monthsAway(checkIn), 0), MAX_OFFSET) : 0))
  const [hovered, setHovered] = useState('')

  const pick = (day) => {
    if (!checkIn || checkOut || day <= checkIn) onChange(day, '')
    else onChange(checkIn, day)
  }

  // While choosing the checkout, preview the range up to the hovered day
  const rangeEnd = checkOut || (checkIn && hovered > checkIn ? hovered : '')
  const weekdays = weekdayNames(locale)

  const visibleMonths = [0, 1].map((i) => {
    const first = new Date(thisYear, thisMonth - 1 + offset + i, 1)
    return { year: first.getFullYear(), month: first.getMonth() }
  })

  const arrow =
    'absolute top-0 flex h-8 w-8 items-center justify-center rounded-full text-[#222222] hover:bg-[#F7F7F7] disabled:cursor-not-allowed disabled:text-[#DDDDDD] disabled:hover:bg-transparent'

  return (
    <div className="relative" onMouseLeave={() => setHovered('')}>
      <button type="button" onClick={() => setOffset(offset - 1)} disabled={offset === 0} aria-label={t('search.prevMonth')} className={`${arrow} left-0`}>
        <svg viewBox="0 0 32 32" aria-hidden="true" className="h-3 w-3 fill-none stroke-current stroke-[4]">
          <path d="M20 28 8.7 16.7a1 1 0 0 1 0-1.4L20 4" />
        </svg>
      </button>
      <button type="button" onClick={() => setOffset(offset + 1)} disabled={offset >= MAX_OFFSET} aria-label={t('search.nextMonth')} className={`${arrow} right-0`}>
        <svg viewBox="0 0 32 32" aria-hidden="true" className="h-3 w-3 fill-none stroke-current stroke-[4]">
          <path d="m12 4 11.3 11.3a1 1 0 0 1 0 1.4L12 28" />
        </svg>
      </button>

      <div className="grid gap-12 sm:grid-cols-2">
        {visibleMonths.map(({ year, month }, index) => (
          <div key={`${year}-${month}`} className={index === 1 ? 'hidden sm:block' : ''}>
            <h3 className="flex h-8 items-center justify-center text-base font-semibold text-[#222222]">{monthTitle(year, month, locale)}</h3>

            <div className="mt-5 grid grid-cols-7 text-center text-xs font-semibold text-[#6A6A6A]" aria-hidden="true">
              {weekdays.map((name, i) => (
                <span key={i}>{name}</span>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-7">
              {monthCells(year, month, locale).map((day, i) =>
                day ? (
                  <Day
                    key={day}
                    day={day}
                    label={longDay(day, locale)}
                    past={day < today}
                    selected={day === checkIn || day === checkOut}
                    previewEnd={!checkOut && day === rangeEnd}
                    inRange={Boolean(checkIn && rangeEnd && day > checkIn && day < rangeEnd)}
                    rangeStart={Boolean(rangeEnd) && day === checkIn}
                    rangeEnd={Boolean(checkIn) && day === rangeEnd}
                    onPick={pick}
                    onHover={setHovered}
                  />
                ) : (
                  <span key={`blank-${i}`} />
                ),
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Day({ day, label, past, selected, previewEnd, inRange, rangeStart, rangeEnd, onPick, onHover }) {
  // Grey band behind the stay; it starts/stops in the middle of the check-in and checkout circles
  let band = ''
  if (inRange) band = 'bg-[#F7F7F7]'
  else if (rangeStart) band = 'bg-[linear-gradient(to_right,transparent_50%,#F7F7F7_50%)]'
  else if (rangeEnd) band = 'bg-[linear-gradient(to_left,transparent_50%,#F7F7F7_50%)]'

  let circle = 'text-[#222222] hover:border hover:border-[#222222]'
  if (selected) circle = 'bg-[#222222] text-white'
  else if (previewEnd) circle = 'border border-[#222222] text-[#222222]'
  else if (past) circle = 'cursor-not-allowed text-[#B0B0B0]'

  return (
    <div className="py-px">
      <div className={band}>
        <button
          type="button"
          disabled={past}
          aria-label={label}
          aria-pressed={selected}
          onClick={() => onPick(day)}
          onMouseEnter={() => onHover(day)}
          className={`mx-auto flex aspect-square w-full max-w-12 items-center justify-center rounded-full text-sm font-semibold ${circle}`}
        >
          {Number(day.slice(8))}
        </button>
      </div>
    </div>
  )
}
