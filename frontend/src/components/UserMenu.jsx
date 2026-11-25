import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext.jsx'
import { useAuthModal } from '../context/AuthModalContext.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'
import Avatar from './Avatar.jsx'

const circle = 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F2F2F2] transition hover:bg-[#EBEBEB]'

/**
 * Right side of the header, Airbnb style: a round login button (your avatar once logged in, linking to your
 * profile) and a round ☰ button opening the menu. Language lives in the menu.
 * On phones the bottom bar (MobileNav.jsx) shows the same menu items in a sheet.
 */
export default function UserMenu({ onOpenLanguage }) {
  const { user } = useAuth()
  const { openAuthModal } = useAuthModal()
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  // Close on outside click and Escape (clicking an item closes it too, see onClick on the menu)
  useEffect(() => {
    if (!open) return
    const onClick = (event) => menuRef.current?.contains(event.target) || setOpen(false)
    const onKey = (event) => event.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="flex items-center gap-2">
      {user ? (
        <Link to={`/users/${user.id}`} aria-label={t('menu.profile')} className={circle}>
          <Avatar user={user} size="sm" />
        </Link>
      ) : (
        <button type="button" onClick={() => openAuthModal()} aria-label={t('menu.loginOrSignup')} className={circle}>
          <UserIcon className="h-[22px] w-[22px]" />
        </button>
      )}

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={t('header.menu')}
          className={`${circle} ${open ? 'bg-[#EBEBEB]' : ''}`}
        >
          <svg viewBox="0 0 32 32" aria-hidden="true" className="h-4 w-4 fill-none stroke-[#222222] stroke-[3]">
            <path d="M2 16h28M2 24h28M2 8h28" />
          </svg>
        </button>

        {open && (
          <div
            role="menu"
            onClick={(event) => event.target.closest('a, button') && setOpen(false)}
            className="absolute right-0 z-50 mt-3 w-72 overflow-hidden rounded-3xl bg-white py-3 shadow-[0_2px_16px_rgba(0,0,0,0.12)]"
          >
            <MenuItems onOpenLanguage={onOpenLanguage} />
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * The menu's links (Trips, Wishlists, Language, Become a host, Log out…), shared by the ☰ dropdown and the
 * phone sheet. `hideLogin` drops "Log in or sign up" where the sheet already shows a big Log in button.
 */
export function MenuItems({ onOpenLanguage, hideLogin = false }) {
  const { user, isHost, isAdmin, logout } = useAuth()
  const { openAuthModal } = useAuthModal()
  const { t } = useI18n()
  const navigate = useNavigate()

  const handleLogout = async () => {
    // Leave protected pages first, otherwise they'd redirect when the user disappears
    navigate('/')
    await logout()
  }

  const item = 'flex w-full items-center gap-3 px-6 py-3 text-left text-[15px] text-[#222222] hover:bg-[#F7F7F7]'
  const divider = <div className="mx-6 my-2 border-t border-[#DDDDDD]" />

  const languageItem = (
    <button type="button" role="menuitem" onClick={onOpenLanguage} className={item}>
      <GlobeIcon />
      {t('menu.language')}
    </button>
  )

  // Guests (and visitors) see the pitch; hosts already are one
  const becomeHostItem = (
    <Link to="/become-a-host" role="menuitem" className={`${item} justify-between py-4`}>
      <span>
        <span className="block font-semibold">{t('menu.becomeHost')}</span>
        <span className="block text-[13px] leading-snug text-[#6A6A6A]">{t('menu.becomeHostHint')}</span>
      </span>
      <span aria-hidden="true" className="text-4xl">
        🏡
      </span>
    </Link>
  )

  if (!user) {
    return (
      <>
        {languageItem}
        {divider}
        {becomeHostItem}
        {!hideLogin && (
          <>
            {divider}
            <button type="button" role="menuitem" onClick={() => openAuthModal()} className={item}>
              {t('menu.loginOrSignup')}
            </button>
          </>
        )}
      </>
    )
  }

  return (
    <>
      <Link to="/trips" role="menuitem" className={`${item} font-semibold`}>
        {t('menu.trips')}
      </Link>
      {isHost && (
        <Link to="/host/reservations" role="menuitem" className={`${item} font-semibold`}>
          {t('menu.reservations')}
        </Link>
      )}
      <Link to="/wishlists" role="menuitem" className={`${item} font-semibold`}>
        {t('menu.wishlists')}
      </Link>
      <Link to="/messages" role="menuitem" className={`${item} font-semibold`}>
        {t('menu.messages')}
      </Link>
      <Link to={`/users/${user.id}`} role="menuitem" className={`${item} font-semibold`}>
        {t('menu.profile')}
      </Link>
      {divider}
      <Link to="/account-settings" role="menuitem" className={item}>
        {t('menu.account')}
      </Link>
      {languageItem}
      {isAdmin && (
        <Link to="/admin/users" role="menuitem" className={item}>
          {t('menu.manageUsers')}
        </Link>
      )}
      {divider}
      {user.role === 'guest' && (
        <>
          {becomeHostItem}
          {divider}
        </>
      )}
      <button type="button" role="menuitem" onClick={handleLogout} className={item}>
        {t('menu.logout')}
      </button>
    </>
  )
}

/** Person in a circle (login button here and in the phone bottom bar). */
export function UserIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`fill-none stroke-current stroke-[1.8] ${className}`}>
      <circle cx="12" cy="12" r="9.5" />
      <circle cx="12" cy="10" r="3.2" />
      <path d="M6.3 18.4c1.3-2.1 3.3-3.3 5.7-3.3s4.4 1.2 5.7 3.3" />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4 shrink-0 fill-[#222222]">
      <path d="M8 .25a7.77 7.77 0 0 1 7.75 7.78 7.75 7.75 0 0 1-7.52 7.72h-.25A7.75 7.75 0 0 1 .25 8.24v-.25A7.75 7.75 0 0 1 8 .25zm1.95 8.5h-3.9c.15 2.9 1.17 5.34 1.88 5.5H8c.68 0 1.72-2.37 1.93-5.23zm4.26 0h-2.76c-.09 1.96-.53 3.78-1.18 5.08A6.26 6.26 0 0 0 14.17 9zm-9.67 0H1.8a6.26 6.26 0 0 0 3.94 5.08 12.59 12.59 0 0 1-1.16-4.7l-.03-.38zm1.2-6.58-.12.05a6.26 6.26 0 0 0-3.83 5.03h2.75c.09-1.83.48-3.54 1.06-4.81zm2.25-.42c-.7 0-1.78 2.51-1.94 5.5h3.9c-.15-2.9-1.18-5.34-1.89-5.5h-.07zm2.28.43.03.05a12.95 12.95 0 0 1 1.15 5.02h2.75a6.28 6.28 0 0 0-3.93-5.07z" />
    </svg>
  )
}
