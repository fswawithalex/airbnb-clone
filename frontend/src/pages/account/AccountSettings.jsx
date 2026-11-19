import { Link } from 'react-router'
import { useAuth } from '../../context/AuthContext.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'
import icons from './icons.jsx'

/** /account-settings — the card grid ("Personal info", "Login & security", …). */
export default function AccountSettings() {
  const { user, isAdmin } = useAuth()
  const { t } = useI18n()

  const cards = [
    { to: '/account-settings/personal-info', icon: icons.person, title: t('account.personalInfo'), text: t('account.personalInfoDesc') },
    { to: '/account-settings/login-and-security', icon: icons.shield, title: t('account.security'), text: t('account.securityDesc') },
    { to: '/account-settings/preferences', icon: icons.globe, title: t('account.preferences'), text: t('account.preferencesDesc') },
    { to: '/become-a-host', icon: icons.home, title: t('account.hosting'), text: t('account.hostingDesc') },
    ...(isAdmin ? [{ to: '/admin/users', icon: icons.users, title: t('account.manageUsers'), text: t('account.manageUsersDesc') }] : []),
  ]

  return (
    <div className="mx-auto max-w-[1080px]">
      <h1 className="text-[32px] font-semibold leading-9 text-[#222222]">{t('account.title')}</h1>
      <p className="mt-2 text-lg text-[#222222]">
        <span className="font-semibold">{user.name}</span>, {user.email} ·{' '}
        <Link to={`/users/${user.id}`} className="font-semibold underline">
          {t('account.goToProfile')}
        </Link>
      </p>

      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="flex min-h-[156px] flex-col rounded-xl p-4 shadow-[0_6px_16px_rgba(0,0,0,0.12)] transition hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)]"
          >
            <span className="h-8 w-8 text-[#222222]">{card.icon}</span>
            <span className="mt-auto pt-8 text-base font-semibold text-[#222222]">{card.title}</span>
            <span className="mt-1 text-sm text-[#6A6A6A]">{card.text}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
