import { useSearchParams } from 'react-router'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { whenFromSearch, whenLabel } from '../../lib/calendar.js'
import { CATEGORIES, guestsFromSearch, guestsLabel, readSearch } from '../../lib/search.js'

/**
 * The small "🏠 Anywhere | Anytime | Add guests 🔍" pill the header shrinks into once you scroll down
 * (from 640px). Shows the current search; clicking it opens the full search bar again (`onOpen`).
 */
export default function CompactSearch({ onOpen }) {
  const { t, locale } = useI18n()
  const [searchParams] = useSearchParams()
  const search = readSearch(searchParams)

  const icon = CATEGORIES.find(({ id }) => id === (search.category || 'all'))?.icon
  const when = whenLabel(whenFromSearch(search), t, locale)
  const who = guestsLabel(guestsFromSearch(search), t, locale)

  const part = 'min-w-0 truncate px-3 text-sm font-medium lg:px-4'
  const divider = <span aria-hidden="true" className="h-6 w-px shrink-0 bg-[#DDDDDD]" />

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={t('search.start')}
      className="flex h-12 max-w-full items-center rounded-full border border-[#DDDDDD] bg-white pl-3 pr-2 text-[#222222] shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.05)] transition hover:shadow-[0_2px_6px_rgba(0,0,0,0.18)]"
    >
      <span aria-hidden="true" className="shrink-0 text-2xl leading-none">
        {icon}
      </span>
      <span className={part}>{search.location || t('search.anywhere')}</span>
      {divider}
      <span className={part}>{when || t('search.anytime')}</span>
      {divider}
      <span className={`${part} ${who ? '' : 'text-[#6A6A6A]'}`}>{who || t('search.addGuests')}</span>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(to_right,#E61E4D_0%,#E31C5F_50%,#D70466_100%)] text-white">
        <svg viewBox="0 0 32 32" aria-hidden="true" className="h-3 w-3 fill-none stroke-current stroke-[5]">
          <path d="M13 24a11 11 0 1 0 0-22 11 11 0 0 0 0 22zm8-3 9 9" />
        </svg>
      </span>
    </button>
  )
}
