import { useEffect, useRef, useState } from 'react'
import { FaAirbnb } from 'react-icons/fa'
import { Link, Outlet, useLocation, useSearchParams } from 'react-router'
import { OFFERING_CATEGORIES, hasSearch, readSearch } from '../lib/search.js'
import { useAuth } from '../context/AuthContext.jsx'
import { AuthModalProvider } from '../context/AuthModalContext.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'
import LanguageModal from './header/LanguageModal.jsx'
import CategoryTabs from './search/CategoryTabs.jsx'
import CompactSearch from './search/CompactSearch.jsx'
import FiltersButton from './search/FiltersButton.jsx'
import HeaderSearch from './search/HeaderSearch.jsx'
import MobileSearch from './search/MobileSearch.jsx'
import MobileNav from './MobileNav.jsx'
import UserMenu from './UserMenu.jsx'

/**
 * Homepage header from 640px, like airbnb.com: fixed at the top; once you scroll it shrinks to one row with a
 * compact "Anywhere | Anytime | Add guests" pill. Clicking the pill opens the full search again until you scroll on.
 * The header is position: fixed, so a spacer of its full height keeps the page from jumping when it shrinks.
 */
function useCollapsingHeader(enabled, searching) {
  const headerRef = useRef(null)
  const [scrolled, setScrolled] = useState(false)
  const [reopened, setReopened] = useState(false)
  const [fullHeight, setFullHeight] = useState(0)
  const [compactHeight, setCompactHeight] = useState(0)
  const reopenedAtY = useRef(0)
  // Search results (like Airbnb): the compact header from the start, not only after scrolling
  const shrinkable = enabled && (scrolled || searching)
  const collapsed = shrinkable && !reopened
  const collapsedRef = useRef(collapsed)

  useEffect(() => {
    collapsedRef.current = collapsed
  }, [collapsed])

  useEffect(() => {
    if (!enabled) return
    const onScroll = () => {
      setScrolled(window.scrollY > 16)
      // Reopened with the pill: scrolling on shrinks it again
      if (Math.abs(window.scrollY - reopenedAtY.current) > 80) setReopened(false)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [enabled])

  // Remember both heights (they change with the screen width) for the spacer
  useEffect(() => {
    const header = headerRef.current
    if (!enabled || !header) return
    const observer = new ResizeObserver(() =>
      collapsedRef.current ? setCompactHeight(header.offsetHeight) : setFullHeight(header.offsetHeight),
    )
    observer.observe(header)
    return () => observer.disconnect()
  }, [enabled])

  return {
    headerRef,
    collapsed,
    // Homepage: room for the full header (it only shrinks while scrolling). Results: room for the compact one.
    spacerHeight: searching ? compactHeight : fullHeight,
    reopenedOverPage: shrinkable && reopened,
    reopen: () => {
      reopenedAtY.current = window.scrollY
      setReopened(true)
    },
    close: () => setReopened(false),
  }
}

export default function Layout() {
  const { t } = useI18n()
  const { isHost } = useAuth()
  const [languageOpen, setLanguageOpen] = useState(false)
  // The homepage gets the tabs + search bar in the header and a full-width grid; other pages keep the narrow column
  const isHome = useLocation().pathname === '/'
  // Same side margins as airbnb.com: 24px on phones, 40px on tablets, 48px from 1024px up
  const width = isHome ? 'max-w-[1880px] px-6 md:px-10 lg:px-12' : 'max-w-6xl px-4'
  const [searchParams] = useSearchParams()
  const currentSearch = readSearch(searchParams)
  // A real search (where / when / who / filters), not just a tab
  const searching = isHome && hasSearch({ ...currentSearch, category: '' })
  // Results of homes / hotels get "Filters" next to the compact pill (experiences / services have none)
  const headerFilters = searching && !OFFERING_CATEGORIES.includes(currentSearch.category)
  const { headerRef, collapsed, spacerHeight, reopenedOverPage, reopen, close } = useCollapsingHeader(isHome, searching)

  // After a search from the header: back to the top, where the results start
  const afterSearch = () => {
    close()
    window.scrollTo({ top: 0 })
  }

  // Logo text: hidden on narrow screens, and when the shrunk header needs the room for the pill
  let wordmark = 'hidden sm:inline'
  if (isHome) wordmark = collapsed ? 'hidden lg:inline' : 'hidden min-[720px]:inline'

  return (
    <AuthModalProvider>
      <div className="flex min-h-screen flex-col bg-white text-gray-900">
        <header
          ref={headerRef}
          className={`relative z-30 border-b border-[#EBEBEB] ${isHome ? 'sm:fixed sm:inset-x-0 sm:top-0' : ''} ${
            collapsed ? 'bg-white shadow-[0_1px_12px_rgba(0,0,0,0.06)]' : 'bg-[linear-gradient(to_bottom,#FFFFFF,#F8F8F8)]'
          }`}
        >
          <div className={`mx-auto ${width}`}>
            {/* Logo | tabs (or the shrunk search pill) | host link, login, ☰. Phones on the homepage: hidden,
                the bottom bar (MobileNav) has login + menu */}
            <div
              className={`h-20 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 ${collapsed ? '' : 'xl:h-24'} ${isHome ? 'hidden sm:grid' : 'grid'}`}
            >
              <Link to="/" className="flex shrink-0 items-center gap-1.5 text-brand" aria-label="airbnb-clone">
                <FaAirbnb aria-hidden="true" className="h-8 w-8" />
                <span className={`${wordmark} whitespace-nowrap text-[22px] font-bold tracking-tight`}>airbnb-clone</span>
              </Link>

              {/* The middle takes the room left between logo and buttons, so the logo never wraps */}
              <div className="flex min-w-0 items-center justify-center gap-3">
                {isHome && (collapsed ? <CompactSearch onOpen={reopen} /> : <CategoryTabs />)}
                {collapsed && headerFilters && (
                  <div className="hidden md:block">
                    <FiltersButton pill />
                  </div>
                )}
              </div>

              {/* Module 1 (users): host link, login / avatar, ☰ menu (language is inside the menu) */}
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  to={isHost ? '/host/reservations' : '/become-a-host'}
                  className="hidden whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold text-[#222222] hover:bg-[#F2F2F2] lg:block"
                >
                  {isHost ? t('header.switchToHosting') : t('menu.becomeHost')}
                </Link>
                <UserMenu onOpenLanguage={() => setLanguageOpen(true)} />
              </div>
            </div>

            {isHome && (
              // Phones: "Start your search" pill, then the tabs as chips. From 640px: the full search bar
              // (hidden while the header is shrunk).
              <div className={`flex flex-col gap-4 pb-4 pt-4 sm:pt-0 ${collapsed ? 'sm:hidden' : 'sm:pb-8'}`}>
                <div className="sm:hidden">
                  <MobileSearch />
                </div>
                <div className="sm:hidden">
                  <CategoryTabs />
                </div>
                <div className="mx-auto hidden w-full max-w-[850px] sm:block">
                  <HeaderSearch onDone={afterSearch} />
                </div>
              </div>
            )}
          </div>
        </header>

        {isHome && (
          <>
            {/* Keeps the page below the fixed header (its full height, so nothing jumps when it shrinks) */}
            <div aria-hidden="true" className="hidden shrink-0 sm:block" style={{ height: spacerHeight }} />
            {/* Search reopened from the pill while scrolled down: dim the page; a click outside closes it */}
            {reopenedOverPage && <div className="fixed inset-0 z-20 hidden bg-black/25 sm:block" onClick={close} />}
          </>
        )}

        {/* pb-24 on phones: room for the bottom bar */}
        <main className={`mx-auto w-full flex-1 ${width} ${isHome ? 'pb-24 pt-6 sm:pb-10 sm:pt-8' : 'pb-24 pt-10 sm:pb-10'}`}>
          <Outlet />
        </main>

        <MobileNav onOpenLanguage={() => setLanguageOpen(true)} />
        <LanguageModal open={languageOpen} onClose={() => setLanguageOpen(false)} />
      </div>
    </AuthModalProvider>
  )
}
