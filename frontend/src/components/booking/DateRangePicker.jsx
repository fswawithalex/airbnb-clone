import { useI18n } from '../../i18n/I18nContext.jsx'
import { addDays, formatDay } from '../../lib/booking.js'
import { todayISO } from '../../lib/dates.js'

/**
 * Check-in / check-out inputs. Native date inputs can't grey out single days,
 * so taken ranges are listed under the inputs and the parent validates overlaps.
 */
export default function DateRangePicker({ checkIn, checkOut, onCheckInChange, onCheckOutChange, unavailable = [] }) {
  const { t, locale } = useI18n()
  const minCheckOut = addDays(checkIn || todayISO(), 1)

  const handleCheckInChange = (value) => {
    onCheckInChange(value)
    // Reset checkout if it is no longer valid
    if (checkOut && checkOut <= value) onCheckOutChange('')
  }

  return (
    <div>
      <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-[#B0B0B0]">
        <label className="block border-r border-[#B0B0B0] px-3 py-2">
          <span className="block text-[10px] font-bold uppercase tracking-wide">{t('booking.checkIn')}</span>
          <input
            type="date"
            min={todayISO()}
            value={checkIn}
            onChange={(e) => handleCheckInChange(e.target.value)}
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>
        <label className="block px-3 py-2">
          <span className="block text-[10px] font-bold uppercase tracking-wide">{t('booking.checkOut')}</span>
          <input
            type="date"
            min={minCheckOut}
            value={checkOut}
            disabled={!checkIn}
            onChange={(e) => onCheckOutChange(e.target.value)}
            className="w-full bg-transparent text-sm outline-none disabled:text-[#B0B0B0]"
          />
        </label>
      </div>

      {unavailable.length > 0 && (
        <details className="mt-2 text-left text-xs text-[#6A6A6A]">
          <summary className="cursor-pointer select-none underline">{t('booking.unavailableDates', { count: unavailable.length })}</summary>
          <ul className="mt-1 space-y-0.5 pl-4">
            {unavailable.map((range) => (
              <li key={`${range.start}-${range.end}`} className="list-disc">
                {formatDay(range.start, locale)} → {formatDay(range.end, locale)}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
