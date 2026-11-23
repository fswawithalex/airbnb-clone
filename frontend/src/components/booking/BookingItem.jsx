import { Link } from 'react-router'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { formatDay, formatMoney, propertyImage } from '../../lib/booking.js'
import BookingStatus from './BookingStatus.jsx'

/** One trip in the guest's Trips list. */
export default function BookingItem({ booking }) {
  const { t, locale } = useI18n()
  const { property } = booking

  return (
    <Link
      to={`/trips/${booking.id}`}
      className="group flex gap-4 rounded-2xl border border-[#EBEBEB] p-3 transition hover:shadow-[0_6px_16px_rgba(0,0,0,0.12)]"
    >
      <img src={propertyImage(property)} alt={property?.title} className="h-28 w-32 shrink-0 rounded-xl object-cover sm:w-40" />
      <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
        <div>
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-semibold group-hover:underline">{property?.title}</p>
            <BookingStatus status={booking.status} />
          </div>
          <p className="mt-0.5 text-sm text-[#6A6A6A]">
            {property?.city}, {property?.country}
          </p>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-2 text-sm">
          <span>
            {formatDay(booking.check_in, locale, { day: 'numeric', month: 'short' })} – {formatDay(booking.check_out, locale)}
            <span className="text-[#6A6A6A]"> · {t('booking.guestsCount', { count: booking.guests })}</span>
          </span>
          <span className="font-semibold">{formatMoney(booking.total_price, locale)}</span>
        </div>
      </div>
    </Link>
  )
}
