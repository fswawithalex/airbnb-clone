import { useState } from 'react'
import { Link, Outlet } from 'react-router'
import { AuthModalProvider } from '../context/AuthModalContext.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'
import LanguageModal from './header/LanguageModal.jsx'
import UserMenu from './UserMenu.jsx'

export default function Layout() {
  const { t } = useI18n()
  const [languageOpen, setLanguageOpen] = useState(false)

  return (
    <AuthModalProvider>
      <div className="flex min-h-screen flex-col bg-white text-gray-900">
        <header className="border-b border-gray-200">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
            <Link to="/" className="whitespace-nowrap text-xl font-bold text-brand">
              airbnb clone
            </Link>

            {/* Module 1 (users): language picker + user menu */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setLanguageOpen(true)}
                aria-label={t('header.language')}
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#F7F7F7]"
              >
                <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4 fill-[#222222]">
                  <path d="M8 .25a7.77 7.77 0 0 1 7.75 7.78 7.75 7.75 0 0 1-7.52 7.72h-.25A7.75 7.75 0 0 1 .25 8.24v-.25A7.75 7.75 0 0 1 8 .25zm1.95 8.5h-3.9c.15 2.9 1.17 5.34 1.88 5.5H8c.68 0 1.72-2.37 1.93-5.23zm4.26 0h-2.76c-.09 1.96-.53 3.78-1.18 5.08A6.26 6.26 0 0 0 14.17 9zm-9.67 0H1.8a6.26 6.26 0 0 0 3.94 5.08 12.59 12.59 0 0 1-1.16-4.7l-.03-.38zm1.2-6.58-.12.05a6.26 6.26 0 0 0-3.83 5.03h2.75c.09-1.83.48-3.54 1.06-4.81zm2.25-.42c-.7 0-1.78 2.51-1.94 5.5h3.9c-.15-2.9-1.18-5.34-1.89-5.5h-.07zm2.28.43.03.05a12.95 12.95 0 0 1 1.15 5.02h2.75a6.28 6.28 0 0 0-3.93-5.07z" />
                </svg>
              </button>
              <UserMenu onOpenLanguage={() => setLanguageOpen(true)} />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
          <Outlet />
        </main>

        <LanguageModal open={languageOpen} onClose={() => setLanguageOpen(false)} />
      </div>
    </AuthModalProvider>
  )
}
