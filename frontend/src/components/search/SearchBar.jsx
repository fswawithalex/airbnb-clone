import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { whenLabel } from '../../lib/calendar.js'
import { saveRecentSearch } from '../../lib/recentSearches.js'
import { guestsLabel } from '../../lib/search.js'
import Modal from '../ui/Modal.jsx'
import GuestsPanel from './GuestsPanel.jsx'
import WherePanel from './WherePanel.jsx'
import WhenPanel from './WhenPanel.jsx'

const EMPTY_WHEN = { mode: 'dates', check_in: '', check_out: '', flexible_days: 0, stay: 'week', months: [] }

const label = 'block text-xs font-semibold text-[#222222]'
const panel = 'absolute top-full z-30 mt-3 rounded-[32px] bg-white shadow-[0_6px_20px_rgba(0,0,0,0.2)]'

/**
 * Airbnb-style "Where | When | Who [Search]" pill. Clicking a box highlights it and opens its dropdown
 * (recent searches + suggested cities for Where, calendar for When, guest counter for Who); the rest of the
 * bar turns grey. A stacked card on phones.
 * Edits stay local until Search; `initial` is read once (remount with a new key to reset).
 */
export default function SearchBar({ initial, onSearch }) {
  const { t, locale } = useI18n()
  const formRef = useRef(null)
  const [active, setActive] = useState(null) // 'where' | 'when' | 'who' | null
  const [location, setLocation] = useState(initial.location)
  const [when, setWhen] = useState(() => ({
    mode: initial.stay ? 'flexible' : 'dates',
    check_in: initial.check_in,
    check_out: initial.check_out,
    flexible_days: Number(initial.flexible_days) || 0,
    stay: initial.stay || 'week',
    months: initial.months,
  }))
  const [guests, setGuests] = useState(() => ({
    adults: Number(initial.adults) || 0,
    children: Number(initial.children) || 0,
    infants: Number(initial.infants) || 0,
    pets: Number(initial.pets) || 0,
  }))
  const [serviceAnimalOpen, setServiceAnimalOpen] = useState(false)

  // Close the open dropdown on a click outside the bar, or Escape. Not while the service animal dialog
  // (rendered outside the bar) is open: closing it should bring you back to the Who counters.
  useEffect(() => {
    if (!active || serviceAnimalOpen) return
    const onPointer = (event) => !formRef.current?.contains(event.target) && setActive(null)
    const onKey = (event) => event.key === 'Escape' && setActive(null)
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [active, serviceAnimalOpen])

  const toggle = (box) => setActive((current) => (current === box ? null : box))
  // `changes` = the keys to replace, or a function of the current value (for toggles)
  const updateWhen = (changes) =>
    setWhen((current) => ({ ...current, ...(typeof changes === 'function' ? changes(current) : changes) }))

  // Runs the search and remembers it for "Recent searches" (only searches with a place)
  const search = (values) => {
    setActive(null)
    saveRecentSearch(values)
    onSearch(values)
  }

  const submit = (event) => {
    event.preventDefault()
    // Check-in picked but no checkout yet: keep the calendar open instead of searching half a range
    if (when.mode === 'dates' && when.check_in && !when.check_out) {
      setActive('when')
      return
    }
    const flexible = when.mode === 'flexible'
    search({
      location: location.trim(),
      check_in: flexible ? '' : when.check_in,
      check_out: flexible ? '' : when.check_out,
      flexible_days: !flexible && when.check_in && when.flexible_days ? String(when.flexible_days) : '',
      stay: flexible ? when.stay : '',
      months: flexible ? when.months : [],
      ...Object.fromEntries(Object.entries(guests).map(([key, count]) => [key, count > 0 ? String(count) : ''])),
    })
  }

  // Where → a suggested city: fill it in and go on to the dates, like Airbnb
  const pickCity = (city) => {
    setLocation(city)
    setActive('when')
  }

  const whenText = whenLabel(when, t, locale)
  const whoText = guestsLabel(guests, t, locale)

  // The highlighted box is white and floats; the others get a hover shade that shows on the grey bar too
  const box = (name) =>
    `relative min-w-0 rounded-full transition-colors ${
      active === name
        ? 'bg-white shadow-[0_0_0_2px_#222222,0_6px_20px_rgba(0,0,0,0.18)]'
        : active
          ? 'hover:bg-[#DDDDDD]'
          : 'hover:bg-[#EBEBEB]'
    }`
  // Divider between two boxes, hidden when one of them is highlighted
  const divider = (left, right) => (
    <span className={`hidden h-8 w-px shrink-0 bg-[#DDDDDD] sm:block ${active === left || active === right ? 'sm:invisible' : ''}`} />
  )

  return (
    <form ref={formRef} role="search" onSubmit={submit} className="relative">
      <div
        className={`flex flex-col gap-1 rounded-[32px] border border-[#DDDDDD] p-2 shadow-[0_3px_12px_rgba(0,0,0,0.08)] transition-colors sm:flex-row sm:items-center sm:gap-0 sm:rounded-full sm:p-0 ${
          active ? 'bg-[#EBEBEB]' : 'bg-white'
        }`}
      >
        {/* Where */}
        <label className={`${box('where')} block cursor-pointer px-8 py-3.5 sm:flex-1`}>
          <span className={label}>{t('search.where')}</span>
          <input
            type="search"
            name="location"
            value={location}
            onChange={(e) => {
              setLocation(e.target.value)
              setActive('where')
            }}
            onFocus={() => setActive('where')}
            autoComplete="off"
            placeholder={t('search.wherePlaceholder')}
            maxLength={100}
            className="w-full truncate bg-transparent text-sm text-[#222222] outline-none placeholder:text-[#6A6A6A]"
          />
        </label>

        {divider('where', 'when')}

        {/* When */}
        <div className={`${box('when')} sm:flex-1`}>
          <button
            type="button"
            onClick={() => toggle('when')}
            aria-expanded={active === 'when'}
            className="block w-full rounded-full px-8 py-3.5 text-left"
          >
            <span className={label}>{t('search.when')}</span>
            <span className={`block truncate pr-6 text-sm ${whenText ? 'text-[#222222]' : 'text-[#6A6A6A]'}`}>
              {whenText || t('search.addDates')}
            </span>
          </button>
          {active === 'when' && whenText && <ClearButton label={t('search.clearDates')} onClick={() => setWhen(EMPTY_WHEN)} />}
        </div>

        {divider('when', 'who')}

        {/* Who + Search */}
        <div className={`${box('who')} flex items-center gap-2 sm:flex-1 sm:pr-2`}>
          <button
            type="button"
            onClick={() => toggle('who')}
            aria-expanded={active === 'who'}
            className="min-w-0 flex-1 rounded-full py-3.5 pl-8 text-left"
          >
            <span className={label}>{t('search.who')}</span>
            <span className={`block truncate text-sm ${whoText ? 'text-[#222222]' : 'text-[#6A6A6A]'}`}>
              {whoText || t('search.addGuests')}
            </span>
          </button>

          <button
            type="submit"
            className={`flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[linear-gradient(to_right,#E61E4D_0%,#E31C5F_50%,#D70466_100%)] px-5 font-semibold text-white transition-all active:scale-95 ${
              active ? '' : 'sm:w-12 sm:px-0'
            }`}
          >
            <svg viewBox="0 0 32 32" aria-hidden="true" className="h-4 w-4 shrink-0 fill-none stroke-current stroke-[4]">
              <path d="M13 24a11 11 0 1 0 0-22 11 11 0 0 0 0 22zm8-3 9 9" />
            </svg>
            <span className={active ? '' : 'sm:sr-only'}>{t('search.submit')}</span>
          </button>
        </div>
      </div>

      {active === 'where' && (
        <div className={`${panel} inset-x-0 overflow-hidden sm:right-auto sm:w-[425px]`}>
          <WherePanel query={location} onPickCity={pickCity} onPickRecent={search} />
        </div>
      )}

      {active === 'when' && (
        <div className={`${panel} inset-x-0 p-4 sm:p-8`}>
          <WhenPanel value={when} onChange={updateWhen} />
        </div>
      )}

      {active === 'who' && (
        <div className={`${panel} inset-x-0 sm:left-auto sm:w-[425px]`}>
          <GuestsPanel value={guests} onChange={setGuests} onServiceAnimal={() => setServiceAnimalOpen(true)} />
        </div>
      )}

      <Modal open={serviceAnimalOpen} title={t('search.serviceAnimalTitle')} onClose={() => setServiceAnimalOpen(false)}>
        <p className="text-base text-[#222222]">{t('search.serviceAnimalText')}</p>
      </Modal>
    </form>
  )
}

function ClearButton({ label: text, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={text}
      className="absolute right-4 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-[#EBEBEB] hover:bg-[#DDDDDD]"
    >
      <svg viewBox="0 0 32 32" aria-hidden="true" className="h-2.5 w-2.5 fill-none stroke-[#222222] stroke-[4]">
        <path d="m6 6 20 20M26 6 6 26" />
      </svg>
    </button>
  )
}
