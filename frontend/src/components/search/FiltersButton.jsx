import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { countFilters, readSearch, toSearchParams } from '../../lib/search.js'
import FiltersModal from './FiltersModal.jsx'

/**
 * "Filters" button + its dialog (price, type, bedrooms, amenities), reading and writing the URL.
 * Used on the homepage and, while searching, in the header next to the compact search pill (`pill`: round, taller).
 */
export default function FiltersButton({ pill = false }) {
  const { t } = useI18n()
  const [searchParams, setSearchParams] = useSearchParams()
  const search = readSearch(searchParams)
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [setOpen]) // stable, or the dialog would refocus on every render
  const count = countFilters(search)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={count > 0 ? `${t('filters.button')} (${count})` : t('filters.button')}
        className={`flex shrink-0 items-center gap-2 border px-4 text-sm font-semibold text-[#222222] transition hover:border-[#222222] ${
          pill ? 'h-12 rounded-full' : 'h-10 rounded-xl'
        } ${count > 0 ? 'border-[#222222] bg-[#F7F7F7]' : 'border-[#DDDDDD] bg-white'}`}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-[1.5]">
          <path d="M1.5 4h8m3 0h2M1.5 12h2m3 0h8" />
          <circle cx="11" cy="4" r="1.75" />
          <circle cx="5" cy="12" r="1.75" />
        </svg>
        {t('filters.button')}
        {count > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#222222] px-1.5 text-[11px] text-white">
            {count}
          </span>
        )}
      </button>

      {open && (
        <FiltersModal
          initial={search}
          onClose={close}
          onApply={(next) => {
            setOpen(false)
            setSearchParams(toSearchParams(next))
          }}
        />
      )}
    </>
  )
}
