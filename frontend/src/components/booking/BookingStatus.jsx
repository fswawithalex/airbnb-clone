import { useI18n } from '../../i18n/I18nContext.jsx'

const STYLES = {
  pending: 'border-amber-200 bg-amber-50 text-amber-800',
  confirmed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  completed: 'border-neutral-200 bg-neutral-100 text-neutral-700',
  cancelled: 'border-red-200 bg-red-50 text-red-700',
  rejected: 'border-red-200 bg-red-50 text-red-700',
  // payment statuses
  paid: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  failed: 'border-neutral-200 bg-neutral-100 text-neutral-700',
  refunded: 'border-sky-200 bg-sky-50 text-sky-700',
}

/** Coloured pill for a booking status (or a payment status with type="payment"). */
export default function BookingStatus({ status, type = 'booking' }) {
  const { t } = useI18n()
  const key = type === 'payment' ? `payment.status_${status}` : `booking.status_${status}`

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${STYLES[status] ?? STYLES.completed}`}>
      {t(key)}
    </span>
  )
}
