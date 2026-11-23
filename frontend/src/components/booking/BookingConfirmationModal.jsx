import { Link } from 'react-router'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { formatDay, formatMoney } from '../../lib/booking.js'
import Modal from '../ui/Modal.jsx'
import BookingStatus from './BookingStatus.jsx'

/** Shown right after a reservation request was created. */
export default function BookingConfirmationModal({ booking, onClose }) {
  const { t, locale } = useI18n()
  if (!booking) return null

  const rows = [
    [t('booking.checkIn'), formatDay(booking.check_in, locale)],
    [t('booking.checkOut'), formatDay(booking.check_out, locale)],
    [t('booking.guests'), booking.guests],
    [t('booking.total'), formatMoney(booking.total_price, locale)],
  ]

  return (
    <Modal
      open
      title={t('booking.requestSentTitle')}
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <Link
            to={`/trips/${booking.id}`}
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-lg bg-[#222222] px-6 font-semibold text-white hover:bg-black"
          >
            {t('booking.viewTrip')}
          </Link>
          <button type="button" onClick={onClose} className="min-h-12 flex-1 rounded-lg border border-[#222222] px-6 font-semibold hover:bg-[#F7F7F7]">
            {t('common.close')}
          </button>
        </div>
      }
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold">{booking.property?.title}</p>
        <BookingStatus status={booking.status} />
      </div>
      <p className="mt-2 text-sm text-[#6A6A6A]">{t('booking.requestSentText')}</p>
      <dl className="mt-5 divide-y divide-[#EBEBEB] rounded-xl border border-[#DDDDDD] text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between px-4 py-3">
            <dt className="text-[#6A6A6A]">{label}</dt>
            <dd className="font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  )
}
