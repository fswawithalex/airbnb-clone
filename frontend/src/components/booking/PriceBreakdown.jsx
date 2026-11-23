import { useI18n } from '../../i18n/I18nContext.jsx'
import { formatMoney, nightsBetween } from '../../lib/booking.js'

/** Estimate shown before booking. The server recomputes the real total. */
export default function PriceBreakdown({ checkIn, checkOut, pricePerNight }) {
  const { t, locale } = useI18n()
  const nights = nightsBetween(checkIn, checkOut)
  if (!nights) return null

  const total = nights * Number(pricePerNight)

  return (
    <div className="mt-4 space-y-3 text-left text-base">
      <div className="flex justify-between">
        <span className="underline">
          {formatMoney(pricePerNight, locale)} × {t(nights === 1 ? 'booking.night' : 'booking.nights', { count: nights })}
        </span>
        <span>{formatMoney(total, locale)}</span>
      </div>
      <div className="flex justify-between border-t border-[#DDDDDD] pt-3 font-semibold">
        <span>{t('booking.total')}</span>
        <span>{formatMoney(total, locale)}</span>
      </div>
    </div>
  )
}
