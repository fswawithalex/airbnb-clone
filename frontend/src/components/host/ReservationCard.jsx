import { Link } from 'react-router'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { formatDay, formatMoney, propertyImage } from '../../lib/booking.js'
import Avatar from '../Avatar.jsx'
import BookingStatus from '../booking/BookingStatus.jsx'
import ReservationActions from './ReservationActions.jsx'

/** One reservation card on the host's Reservations page. */
export default function ReservationCard({ booking, onUpdated, onError }) {
  const { t, locale } = useI18n()
  const { property, guest, payments = [] } = booking
  const latestPayment = payments[0] ?? null
  const currency = latestPayment?.currency || 'EUR'

  return (
    <article className="rounded-2xl border border-[#EBEBEB] bg-white p-5 transition hover:shadow-[0_6px_16px_rgba(0,0,0,0.08)]">
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link to={`/properties/${property?.id}`} className="shrink-0">
          <img
            src={propertyImage(property)}
            alt={property?.title}
            className="h-32 w-full rounded-xl object-cover sm:h-28 sm:w-40"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <Link to={`/properties/${property?.id}`} className="block truncate font-semibold hover:underline">
                {property?.title}
              </Link>
              <p className="text-xs text-[#6A6A6A]">
                {t('booking.reservationNumber', { id: booking.id })} · {property?.city}, {property?.country}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <BookingStatus status={booking.status} />
              {latestPayment && <BookingStatus status={latestPayment.status} type="payment" />}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-4 text-sm">
            {guest && (
              <Link to={`/users/${guest.id}`} className="inline-flex items-center gap-2.5 hover:underline">
                <Avatar user={guest} size="sm" />
                <span className="font-medium">{guest.first_name || guest.name}</span>
              </Link>
            )}

            <div className="text-sm text-[#222222]">
              <span className="font-medium">
                {formatDay(booking.check_in, locale, { day: 'numeric', month: 'short' })} – {formatDay(booking.check_out, locale)}
              </span>
              <span className="text-[#6A6A6A]">
                {' '}· {t(booking.nights === 1 ? 'booking.night' : 'booking.nights', { count: booking.nights })}
                {' '}· {t('booking.guestsCount', { count: booking.guests })}
              </span>
            </div>

            <span className="text-base font-semibold">{formatMoney(booking.total_price, locale, currency)}</span>
          </div>
        </div>
      </div>

      <ReservationActions booking={booking} onUpdated={onUpdated} onError={onError} />
    </article>
  )
}
