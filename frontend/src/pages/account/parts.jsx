import { Link } from 'react-router'
import { useI18n } from '../../i18n/I18nContext.jsx'

/** "Account › Personal info" + big title, like Airbnb's settings sub-pages. */
export function SettingsHeader({ title }) {
  const { t } = useI18n()
  return (
    <div className="mb-10">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm font-semibold text-[#222222]">
        <Link to="/account-settings" className="hover:underline">
          {t('account.title')}
        </Link>
        <svg viewBox="0 0 32 32" aria-hidden="true" className="h-3 w-3 fill-none stroke-[#222222] stroke-[4]">
          <path d="m12 4 11.3 11.3a1 1 0 0 1 0 1.4L12 28" />
        </svg>
        <span>{title}</span>
      </nav>
      <h1 className="mt-4 text-[32px] font-semibold leading-9 text-[#222222]">{title}</h1>
    </div>
  )
}

/** Two columns: rows on the left, info cards on the right (stacked on phones). */
export function SettingsLayout({ children, aside }) {
  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:gap-24">
      <div>{children}</div>
      {aside && <aside className="space-y-0 self-start rounded-xl border border-[#DDDDDD] p-6 lg:sticky lg:top-28">{aside}</aside>}
    </div>
  )
}

export function InfoCard({ icon, title, children }) {
  return (
    <div className="border-b border-[#DDDDDD] py-6 first:pt-0 last:border-b-0 last:pb-0">
      <div className="mb-4 h-10 w-10 text-brand">{icon}</div>
      <h3 className="mb-2 text-lg font-semibold text-[#222222]">{title}</h3>
      <p className="text-sm leading-5 text-[#6A6A6A]">{children}</p>
    </div>
  )
}

/**
 * One editable row ("Legal name   Edit"). While one row is being edited the others are greyed out,
 * exactly like Airbnb.
 */
export function SettingsRow({ id, title, value, hint, editing, onEdit, onCancel, disabled, actionLabel, children }) {
  const { t } = useI18n()
  return (
    <div className={`border-b border-[#DDDDDD] py-6 ${disabled ? 'opacity-30' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 id={id} className="text-base text-[#222222]">
            {title}
          </h3>
          {editing ? (
            hint && <p className="mt-1 text-sm text-[#6A6A6A]">{hint}</p>
          ) : (
            <p className="mt-1 truncate text-sm text-[#6A6A6A]">{value}</p>
          )}
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={editing ? onCancel : onEdit}
          className="shrink-0 text-base font-semibold text-[#222222] underline disabled:cursor-not-allowed"
        >
          {editing ? t('common.cancel') : (actionLabel ?? t('common.edit'))}
        </button>
      </div>
      {editing && <div className="mt-4">{children}</div>}
    </div>
  )
}
