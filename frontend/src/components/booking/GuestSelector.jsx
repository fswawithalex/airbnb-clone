import { useI18n } from '../../i18n/I18nContext.jsx'

export default function GuestSelector({ guests, maxGuests, onChange }) {
  const { t } = useI18n()

  const update = (amount) => {
    const next = guests + amount
    if (next >= 1 && next <= maxGuests) onChange(next)
  }

  const stepButton = 'flex h-8 w-8 items-center justify-center rounded-full border border-[#B0B0B0] text-lg leading-none text-[#6A6A6A] hover:border-[#222222] hover:text-[#222222] disabled:cursor-not-allowed disabled:opacity-30'

  return (
    <div className="mt-3 flex items-center justify-between rounded-lg border border-[#B0B0B0] px-3 py-2">
      <div className="text-left">
        <span className="block text-[10px] font-bold uppercase tracking-wide">{t('booking.guests')}</span>
        <span className="block text-xs text-[#6A6A6A]">{t('booking.maxGuests', { count: maxGuests })}</span>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => update(-1)} disabled={guests <= 1} className={stepButton} aria-label={t('booking.fewerGuests')}>
          −
        </button>
        <span className="min-w-4 text-center text-sm">{guests}</span>
        <button type="button" onClick={() => update(1)} disabled={guests >= maxGuests} className={stepButton} aria-label={t('booking.moreGuests')}>
          +
        </button>
      </div>
    </div>
  )
}
