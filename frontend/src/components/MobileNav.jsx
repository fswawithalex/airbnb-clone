import { useCallback, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { useAuth } from '../context/AuthContext.jsx'
import { useAuthModal } from '../context/AuthModalContext.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'
import Avatar from './Avatar.jsx'
import Button from './ui/Button.jsx'
import Modal from './ui/Modal.jsx'
import { MenuItems, UserIcon } from './UserMenu.jsx'

/**
 * Phones only (< 640px): Airbnb's bottom bar. Explore · Wishlists · (Trips) · Log in / Profile.
 * Log in / Profile opens a sheet with the header menu's items; logged out it starts with a Log in button.
 */
export default function MobileNav({ onOpenLanguage }) {
  const { user } = useAuth()
  const { openAuthModal } = useAuthModal()
  const { t } = useI18n()
  const { pathname } = useLocation()
  const [sheetOpen, setSheetOpen] = useState(false)
  const closeSheet = useCallback(() => setSheetOpen(false), [])

  const tab = (active) =>
    `flex min-w-0 flex-1 flex-col items-center gap-1 pt-2.5 text-[10px] font-semibold ${active ? 'text-brand' : 'text-[#6A6A6A]'}`
  const icon = 'h-6 w-6'

  return (
    <>
      <nav
        aria-label={t('nav.label')}
        className="fixed inset-x-0 bottom-0 z-40 flex justify-center border-t border-[#EBEBEB] bg-white pb-[env(safe-area-inset-bottom)] sm:hidden"
      >
        <div className="flex justify-evenly gap-10 max-w-md">
          <Link to="/" className={tab(pathname === '/')}>
            <svg viewBox="0 0 24 24" aria-hidden="true" className={`${icon} fill-none stroke-current stroke-[2]`}>
              <circle cx="10.5" cy="10.5" r="7" />
              <path d="m16 16 5 5" />
            </svg>
            {t('nav.explore')}
          </Link>

          {/* Wishlists need an account: logged out, the tab asks you to log in */}
          {user ? (
            <Link to="/wishlists" className={tab(pathname.startsWith('/wishlists'))}>
              <HeartIcon className={icon} />
              {t('menu.wishlists')}
            </Link>
          ) : (
            <button type="button" onClick={() => openAuthModal({ redirect: '/wishlists' })} className={tab(false)}>
              <HeartIcon className={icon} />
              {t('menu.wishlists')}
            </button>
          )}

          {user && (
            <Link to="/trips" className={tab(pathname.startsWith('/trips'))}>
              <svg viewBox="0 0 24 24" aria-hidden="true" className={`${icon} fill-none stroke-current stroke-[1.8] [stroke-linejoin:round]`}>
                <rect x="3.5" y="7" width="17" height="12.5" rx="2.5" />
                <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3.5 12.5h17" />
              </svg>
              {t('menu.trips')}
            </Link>
          )}

          <button type="button" onClick={() => setSheetOpen(true)} aria-haspopup="dialog" className={tab(sheetOpen)}>
            {user ? (
              // The 32px avatar shrunk to the 24px of the other icons, so the labels line up
              <span className="flex h-6 w-6 items-center justify-center">
                <span className="scale-75">
                  <Avatar user={user} size="sm" />
                </span>
              </span>
            ) : (
              <UserIcon className={icon} />
            )}
            {user ? t('menu.profile') : t('nav.login')}
          </button>
        </div>
      </nav>

      <Modal open={sheetOpen} title={user ? t('menu.profile') : t('nav.login')} onClose={closeSheet}>
        {/* Tapping any item (or the Log in button) closes the sheet */}
        <div className="-mx-6 -my-3" onClick={(event) => event.target.closest('a, button') && closeSheet()}>
          {!user && (
            <div className="px-6 pb-4 pt-3">
              <p className="text-[15px] text-[#6A6A6A]">{t('nav.loginPrompt')}</p>
              <Button type="button" onClick={() => openAuthModal()} className="mt-4 w-full">
                {t('nav.login')}
              </Button>
            </div>
          )}
          <MenuItems onOpenLanguage={onOpenLanguage} hideLogin />
        </div>
      </Modal>
    </>
  )
}

function HeartIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`fill-none stroke-current stroke-[1.8] [stroke-linejoin:round] ${className}`}>
      <path d="M12 20.5s-7.5-4.6-9-9.2C2 8 4.2 4.5 7.6 4.5c2 0 3.4 1.1 4.4 2.6 1-1.5 2.4-2.6 4.4-2.6 3.4 0 5.6 3.5 4.6 6.8-1.5 4.6-9 9.2-9 9.2z" />
    </svg>
  )
}
