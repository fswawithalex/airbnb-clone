import { useI18n } from '../../i18n/I18nContext.jsx'
import { monthName, upcomingMonths } from '../../lib/calendar.js'
import { countLabel } from '../../lib/listing.js'
import { FLEXIBLE_DAYS, FLEXIBLE_MONTHS, STAY_LENGTHS } from '../../lib/search.js'
import DateRangeCalendar from './DateRangeCalendar.jsx'

/**
 * Dropdown under the bar's "When" box: "Dates" (calendar + "± N days") or "Flexible" (weekend/week/month + months).
 * `value` = { mode, check_in, check_out, flexible_days, stay, months }; onChange receives the changed keys only
 * (or a function of the current value returning them).
 */
export default function WhenPanel({ value, onChange }) {
  const { t, locale } = useI18n()

  return (
    <div>
      <div role="tablist" className="mx-auto flex w-fit rounded-full bg-[#EBEBEB] p-1">
        {['dates', 'flexible'].map((mode) => (
          <button
            key={mode}
            type="button"
            role="tab"
            aria-selected={value.mode === mode}
            onClick={() => onChange({ mode })}
            className={`rounded-full px-6 py-2 text-sm font-semibold text-[#222222] transition sm:px-14 ${
              value.mode === mode ? 'bg-white shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.05)]' : 'hover:bg-[#DDDDDD]'
            }`}
          >
            {t(mode === 'dates' ? 'search.tabDates' : 'search.tabFlexible')}
          </button>
        ))}
      </div>

      {value.mode === 'dates' ? (
        <>
          <div className="mt-8">
            <DateRangeCalendar
              checkIn={value.check_in}
              checkOut={value.check_out}
              onChange={(checkIn, checkOut) => onChange({ check_in: checkIn, check_out: checkOut })}
            />
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {FLEXIBLE_DAYS.map((days) => (
              <Chip key={days} selected={value.flexible_days === days} onClick={() => onChange({ flexible_days: days })}>
                {days === 0 ? t('search.exactDates') : `± ${countLabel(t, locale, 'search.days', days)}`}
              </Chip>
            ))}
          </div>
        </>
      ) : (
        <FlexibleDates stay={value.stay} months={value.months} onChange={onChange} />
      )}
    </div>
  )
}

function FlexibleDates({ stay, months, onChange }) {
  const { t, locale } = useI18n()

  // Read the current months (not this render's) so quick clicks on several months all count
  const toggleMonth = (month) =>
    onChange((current) => ({
      months: current.months.includes(month) ? current.months.filter((m) => m !== month) : [...current.months, month].sort(),
    }))

  return (
    <div className="mt-8 text-center">
      <h3 className="text-lg font-semibold text-[#222222]">{t('search.stayQuestion')}</h3>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {STAY_LENGTHS.map((length) => (
          <Chip key={length} selected={stay === length} onClick={() => onChange({ stay: length })}>
            {t(`search.stay_${length}`)}
          </Chip>
        ))}
      </div>

      <h3 className="mt-10 text-lg font-semibold text-[#222222]">{t('search.goWhen')}</h3>
      <p className="mt-1 text-sm text-[#6A6A6A]">{t('search.monthsHint')}</p>
      <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-6">
        {upcomingMonths(FLEXIBLE_MONTHS).map(({ value, year, month }) => {
          const selected = months.includes(value)
          return (
            <button
              key={value}
              type="button"
              aria-pressed={selected}
              onClick={() => toggleMonth(value)}
              className={`flex flex-col items-center rounded-2xl border px-2 py-4 transition ${
                selected ? 'border-[#222222] bg-[#F7F7F7] shadow-[inset_0_0_0_1px_#222222]' : 'border-[#DDDDDD] hover:border-[#222222]'
              }`}
            >
              <svg viewBox="0 0 32 32" aria-hidden="true" className="h-8 w-8 fill-none stroke-[#6A6A6A] stroke-[1.5]">
                <rect x="4" y="7" width="24" height="21" rx="3" />
                <path d="M4 13h24M11 4v6M21 4v6" />
              </svg>
              <span className="mt-2 text-sm font-semibold text-[#222222]">{monthName(year, month, locale)}</span>
              <span className="text-xs text-[#6A6A6A]">{year}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Chip({ selected, children, ...props }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`rounded-full border px-4 py-2 text-xs text-[#222222] transition ${
        selected ? 'border-[#222222] shadow-[inset_0_0_0_1px_#222222]' : 'border-[#DDDDDD] hover:border-[#222222]'
      }`}
      {...props}
    >
      {children}
    </button>
  )
}
