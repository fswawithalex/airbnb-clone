import { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { CATEGORIES, readSearch, toSearchParams } from '../../lib/search.js'

/**
 * All / Homes / Hotels / Experiences / Services under the logo. Each tab is a link to the homepage with
 * ?category=…, keeping the rest of the search (where / when / who / filters).
 */
export default function CategoryTabs() {
  const { t } = useI18n()
  const [searchParams] = useSearchParams()
  const search = readSearch(searchParams)
  const current = search.category || 'all'
  const navRef = useRef(null)

  // Phones: the row scrolls sideways, so bring the active tab into view (only the row moves, not the page)
  useEffect(() => {
    const nav = navRef.current
    const link = nav?.querySelector('[aria-current="page"]')
    if (nav && link && nav.scrollWidth > nav.clientWidth) {
      nav.scrollLeft = link.offsetLeft - (nav.clientWidth - link.clientWidth) / 2
    }
  }, [current])

  return (
    // Phones (< 640px): round chips (grey = active) in a sideways-scrolling row.
    // 640–1279px: icon above the label, black underline. From 1280px: icon left of the label.
    <nav
      ref={navRef}
      aria-label={t('category.label')}
      className="relative -mx-6 flex justify-start gap-2 overflow-x-auto px-6 [scrollbar-width:none] sm:mx-0 sm:justify-center sm:gap-3 sm:px-0 lg:gap-8 xl:gap-6 [&::-webkit-scrollbar]:hidden"
    >
      {CATEGORIES.map(({ id, icon }) => {
        const active = id === current
        const params = toSearchParams({ ...search, category: id === 'all' ? '' : id })
        return (
          <Link
            key={id}
            to={{ pathname: '/', search: params.toString() }}
            aria-current={active ? 'page' : undefined}
            className={`group relative flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-semibold text-[#222222] transition-colors sm:flex-col sm:gap-1 sm:rounded-none sm:border-0 sm:bg-transparent sm:px-1.5 sm:pb-2.5 sm:pt-1 sm:text-sm xl:flex-row xl:gap-2 xl:px-2 xl:pb-3 xl:pt-2 ${
              active ? 'border-[#B0B0B0] bg-[#F2F2F2]' : 'border-[#DDDDDD] bg-white sm:text-[#6A6A6A] sm:hover:text-[#222222]'
            }`}
          >
            <span aria-hidden="true" className="text-lg leading-none transition-transform group-hover:scale-110 sm:text-[30px] xl:text-[28px]">
              {icon}
            </span>
            {t(`category.${id}`)}
            <span
              aria-hidden="true"
              className={`absolute inset-x-1 bottom-0 hidden h-[3px] rounded-full sm:block ${active ? 'bg-[#222222]' : 'bg-transparent group-hover:bg-[#DDDDDD]'}`}
            />
          </Link>
        )
      })}
    </nav>
  )
}
