import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext.jsx'
import { useAuthModal } from '../context/AuthModalContext.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'
import Avatar from './Avatar.jsx'

/**
 * Airbnb's menu on the right of the header (hamburger + avatar).
 * Wishlists / Trips / Messages point to the routes of the other modules (/wishlists, /trips, /messages).
 */
export default function UserMenu({ onOpenLanguage }) {
  const { user, isHost, isAdmin, logout } = useAuth()
  const { openAuthModal } = useAuthModal()
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const navigate = useNavigate()

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

  const handleLogout = async () => {
    // Leave protected pages first, otherwise they'd redirect when the user disappears
    navigate('/')
    await logout()
  }

  const item = 'block w-full px-4 py-3 text-left text-sm text-[#222222] hover:bg-[#F7F7F7]'
  const divider = <div className="my-2 border-t border-[#EBEBEB]" />

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('header.menu')}
        className={`flex h-12 items-center gap-3 rounded-full border border-[#DDDDDD] pl-3.5 pr-1.5 transition hover:shadow-[0_2px_4px_rgba(0,0,0,0.18)] ${open ? 'shadow-[0_2px_4px_rgba(0,0,0,0.18)]' : ''}`}
      >
        <svg viewBox="0 0 32 32" aria-hidden="true" className="h-4 w-4 fill-none stroke-[#222222] stroke-[3]">
          <path d="M2 16h28M2 24h28M2 8h28" />
        </svg>
        {user ? (
          <Avatar user={user} size="sm" />
        ) : (
          <svg viewBox="0 0 32 32" aria-hidden="true" className="h-[30px] w-[30px] fill-[#6A6A6A]">
            <path d="M16 .7C7.56.7.7 7.56.7 16S7.56 31.3 16 31.3 31.3 24.44 31.3 16 24.44.7 16 .7zm0 28c-4.02 0-7.6-1.88-9.93-4.81a12.43 12.43 0 0 1 6.45-4.4A6.5 6.5 0 0 1 9.5 14a6.5 6.5 0 0 1 13 0 6.51 6.51 0 0 1-3.02 5.5 12.42 12.42 0 0 1 6.45 4.4A12.67 12.67 0 0 1 16 28.7z" />
          </svg>
        )}
      </button>

      {open && (
        <div
          role="menu"
          onClick={(event) => event.target.closest('a, button') && setOpen(false)}
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl bg-white py-2 shadow-[0_2px_16px_rgba(0,0,0,0.12)]"
        >
          {user ? (
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
              <button type="button" role="menuitem" onClick={onOpenLanguage} className={item}>
                {t('menu.language')}
              </button>
              {isAdmin && (
                <Link to="/admin/users" role="menuitem" className={item}>
                  {t('menu.manageUsers')}
                </Link>
              )}
              {divider}
              {user.role === 'guest' && (
                <>
                  <Link to="/become-a-host" role="menuitem" className={`${item} py-2`}>
                    <span className="block font-semibold">{t('menu.becomeHost')}</span>
                    <span className="block text-xs text-[#6A6A6A]">{t('menu.becomeHostHint')}</span>
                  </Link>
                  {divider}
                </>
              )}
              <button type="button" role="menuitem" onClick={handleLogout} className={item}>
                {t('menu.logout')}
              </button>
            </>
          ) : (
            <>
              <Link to="/become-a-host" role="menuitem" className={`${item} py-2`}>
                <span className="block font-semibold">{t('menu.becomeHost')}</span>
                <span className="block text-xs text-[#6A6A6A]">{t('menu.becomeHostHint')}</span>
              </Link>
              {divider}
              <button type="button" role="menuitem" onClick={onOpenLanguage} className={item}>
                {t('menu.language')}
              </button>
              <button type="button" role="menuitem" onClick={() => openAuthModal()} className={`${item} font-semibold`}>
                {t('menu.loginOrSignup')}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
