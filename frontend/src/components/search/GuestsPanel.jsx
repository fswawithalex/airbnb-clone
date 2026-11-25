import { useI18n } from '../../i18n/I18nContext.jsx'
import { GUEST_LIMITS, MAX_GUESTS } from '../../lib/search.js'

const ROWS = ['adults', 'children', 'infants', 'pets']

/**
 * Dropdown under the bar's "Who" box: Adults / Children / Infants / Pets counters, with Airbnb's rules:
 * adults + children ≤ 16, children/infants/pets need an adult (adding one sets adults to 1).
 * `value` = { adults, children, infants, pets } as numbers.
 */
export default function GuestsPanel({ value, onChange, onServiceAnimal }) {
  const { t } = useI18n()
  const guests = value.adults + value.children
  const othersNeedAnAdult = value.children + value.infants + value.pets > 0

  const change = (row, amount) => {
    const next = { ...value, [row]: value[row] + amount }
    if (row !== 'adults' && amount > 0 && next.adults === 0) next.adults = 1
    onChange(next)
  }

  const canDecrease = (row) => value[row] > (row === 'adults' && othersNeedAnAdult ? 1 : 0)
  const canIncrease = (row) =>
    value[row] < GUEST_LIMITS[row] && (row === 'adults' || row === 'children' ? guests < MAX_GUESTS : true)

  return (
    <div className="px-8 py-4">
      {ROWS.map((row) => (
        <div key={row} className="flex items-center justify-between gap-4 border-b border-[#EBEBEB] py-6 last:border-0">
          <div>
            <span className="block text-base font-semibold text-[#222222]">{t(`search.${row}`)}</span>
            {row === 'pets' ? (
              <button
                type="button"
                onClick={onServiceAnimal}
                className="text-left text-sm font-semibold text-[#6A6A6A] underline hover:text-[#222222]"
              >
                {t('search.serviceAnimal')}
              </button>
            ) : (
              <span className="block text-sm text-[#6A6A6A]">{t(`search.${row}Hint`)}</span>
            )}
          </div>
          <Stepper
            name={t(`search.${row}`)}
            value={value[row]}
            canDecrease={canDecrease(row)}
            canIncrease={canIncrease(row)}
            onDecrease={() => change(row, -1)}
            onIncrease={() => change(row, 1)}
          />
        </div>
      ))}
    </div>
  )
}

function Stepper({ name, value, canDecrease, canIncrease, onDecrease, onIncrease }) {
  const { t } = useI18n()
  const button =
    'flex h-8 w-8 items-center justify-center rounded-full bg-[#F2F2F2] text-[#222222] transition hover:bg-[#EBEBEB] disabled:cursor-not-allowed disabled:text-[#C8C8C8] disabled:hover:bg-[#F2F2F2]'

  return (
    <div className="flex shrink-0 items-center gap-4">
      <button type="button" onClick={onDecrease} disabled={!canDecrease} className={button} aria-label={t('search.decrease', { what: name })}>
        <svg viewBox="0 0 32 32" aria-hidden="true" className="h-3 w-3 fill-none stroke-current stroke-[4]">
          <path d="M4 16h24" />
        </svg>
      </button>
      <span className="min-w-4 text-center text-base text-[#222222]" aria-live="polite">
        {value}
      </span>
      <button type="button" onClick={onIncrease} disabled={!canIncrease} className={button} aria-label={t('search.increase', { what: name })}>
        <svg viewBox="0 0 32 32" aria-hidden="true" className="h-3 w-3 fill-none stroke-current stroke-[4]">
          <path d="M16 4v24M4 16h24" />
        </svg>
      </button>
    </div>
  )
}
