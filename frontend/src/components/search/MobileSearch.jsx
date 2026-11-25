import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { readSearch } from '../../lib/search.js'
import HeaderSearch from './HeaderSearch.jsx'

/**
 * Phones only: Airbnb's "Start your search" pill. Tapping it opens the Where / When / Who bar full screen;
 * searching (or ✕ / Escape) closes it again.
 */
export default function MobileSearch() {
  const { t } = useI18n()
  const [searchParams] = useSearchParams()
  const [open, setOpen] = useState(false)
  const location = readSearch(searchParams).location

  // Freeze the page behind the sheet; Escape closes it
  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event) => event.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="flex h-14 w-full items-center justify-center gap-2.5 rounded-full border border-[#EBEBEB] bg-white px-5 text-sm font-semibold text-[#222222] shadow-[0_3px_12px_rgba(0,0,0,0.12)]"
      >
        <svg viewBox="0 0 32 32" aria-hidden="true" className="h-4 w-4 shrink-0 fill-none stroke-current stroke-[4]">
          <path d="M13 24a11 11 0 1 0 0-22 11 11 0 0 0 0 22zm8-3 9 9" />
        </svg>
        <span className="truncate">{location || t('search.start')}</span>
      </button>

      {open && (
        <div role="dialog" aria-modal="true" aria-label={t('search.start')} className="fixed inset-0 z-[90] overflow-y-auto bg-[#F7F7F7] px-4 pb-10 pt-4">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t('common.close')}
            className="mb-4 flex h-9 w-9 items-center justify-center rounded-full border border-[#DDDDDD] bg-white"
          >
            <svg viewBox="0 0 32 32" aria-hidden="true" className="h-3 w-3 fill-none stroke-[#222222] stroke-[4]">
              <path d="m6 6 20 20M26 6 6 26" />
            </svg>
          </button>
          <HeaderSearch onDone={() => setOpen(false)} />
        </div>
      )}
    </>
  )
}
