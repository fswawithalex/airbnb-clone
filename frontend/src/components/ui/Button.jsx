import { useI18n } from '../../i18n/I18nContext.jsx'

const VARIANTS = {
  // Airbnb's pink gradient call-to-action ("Continue", "Agree and continue", "Search")
  primary: 'bg-[linear-gradient(to_right,#E61E4D_0%,#E31C5F_50%,#D70466_100%)] text-white active:scale-[0.98]',
  dark: 'bg-[#222222] text-white hover:bg-black active:scale-[0.98]',
  outline: 'border border-[#222222] bg-white text-[#222222] hover:bg-[#F7F7F7]',
  danger: 'border border-[#C13515] bg-white text-[#C13515] hover:bg-[#FFF8F6]',
  ghost: 'px-2 text-[#222222] underline hover:bg-[#F7F7F7]',
}

export default function Button({ variant = 'primary', loading = false, className = '', children, disabled, ...props }) {
  const { t } = useI18n()

  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className={`inline-flex min-h-12 items-center justify-center rounded-lg px-6 py-3 text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="flex gap-1.5" aria-label={t('common.wait')}>
          {[0, 1, 2].map((dot) => (
            <span key={dot} className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" style={{ animationDelay: `${dot * 150}ms` }} />
          ))}
        </span>
      ) : (
        children
      )}
    </button>
  )
}
