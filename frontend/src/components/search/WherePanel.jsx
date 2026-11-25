import { useEffect, useState } from 'react'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { whenFromSearch, whenLabel } from '../../lib/calendar.js'
import { cityStyle } from '../../lib/featured.js'
import { countLabel } from '../../lib/listing.js'
import { readRecentSearches } from '../../lib/recentSearches.js'
import { guestsFromSearch, guestsLabel, loadDestinations } from '../../lib/search.js'

/**
 * Dropdown under the bar's "Where" box: "Recent searches" (this browser) and "Suggested destinations"
 * (cities that have stays), narrowed down by what is typed in Where.
 * onPickCity(city) fills Where; onPickRecent(search) runs that search again.
 */
export default function WherePanel({ query, onPickCity, onPickRecent }) {
  const { t, locale } = useI18n()
  const [destinations, setDestinations] = useState([])
  const [recent] = useState(readRecentSearches)

  useEffect(() => {
    let active = true
    loadDestinations()
      .then((list) => active && setDestinations(list))
      .catch(() => {}) // no suggestions is fine; typing still works
    return () => {
      active = false
    }
  }, [])

  const typed = query.trim().toLowerCase()
  const matches = typed
    ? destinations.filter(({ city, country }) => `${city} ${country}`.toLowerCase().includes(typed))
    : destinations

  return (
    <div className="max-h-[60vh] overflow-y-auto py-4">
      {!typed && recent.length > 0 && (
        <Group title={t('where.recent')}>
          {recent.map((search) => {
            const details = [whenLabel(whenFromSearch(search), t, locale), guestsLabel(guestsFromSearch(search), t, locale)]
              .filter(Boolean)
              .join(' · ')
            return (
              <Row
                key={JSON.stringify(search)}
                icon="🕘"
                tint="from-[#F2F2F2] to-[#E4E4E4]"
                title={search.location}
                subtitle={details || t('search.anytime')}
                onClick={() => onPickRecent(search)}
              />
            )
          })}
        </Group>
      )}

      {matches.length > 0 ? (
        <Group title={t('where.suggested')}>
          {matches.map(({ city, country, stays }) => {
            const { icon, tint } = cityStyle(city)
            return (
              <Row
                key={`${city}-${country}`}
                icon={icon}
                tint={tint}
                title={`${city}, ${country}`}
                subtitle={countLabel(t, locale, 'row.stays', stays)}
                onClick={() => onPickCity(city)}
              />
            )
          })}
        </Group>
      ) : (
        typed && <p className="px-8 py-2 text-sm text-[#6A6A6A]">{t('where.noMatch', { query: query.trim() })}</p>
      )}
    </div>
  )
}

function Group({ title, children }) {
  return (
    <div className="mb-2">
      <p className="px-8 pb-2 pt-1 text-xs font-semibold text-[#222222]">{title}</p>
      {children}
    </div>
  )
}

function Row({ icon, tint, title, subtitle, onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-4 px-8 py-2.5 text-left hover:bg-[#F7F7F7]">
      <span aria-hidden="true" className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br text-2xl ${tint}`}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[15px] text-[#222222]">{title}</span>
        <span className="block truncate text-sm text-[#6A6A6A]">{subtitle}</span>
      </span>
    </button>
  )
}
