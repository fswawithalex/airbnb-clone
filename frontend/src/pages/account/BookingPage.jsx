import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import Avatar from '../../components/Avatar.jsx'
import BookingStatus from '../../components/booking/BookingStatus.jsx'
import CancelBookingModal from '../../components/booking/CancelBookingModal.jsx'
import Alert from '../../components/ui/Alert.jsx'
import Button from '../../components/ui/Button.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'
import api, { errorMessage } from '../../lib/api.js'
import { canGuestCancel, canPay, formatDay, formatMoney, isPaid, propertyImage } from '../../lib/booking.js'

/** Guest view of a single reservation (/trips/:id). */
export default function BookingPage() {
  const { id } = useParams()
  const { t, locale } = useI18n()

  const [booking, setBooking] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [showFullDesc, setShowFullDesc] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [paying, setPaying] = useState(false)
  const [notice, setNotice] = useState(null) // { type: 'success' | 'error', text: string }

  useEffect(() => {
    let ignore = false
    setLoading(true)
    setError('')
    api
      .get(`/bookings/${id}`)
      .then((res) => !ignore && setBooking(res.data))
      .catch((err) => !ignore && setError(errorMessage(err)))
      .finally(() => !ignore && setLoading(false))
    return () => {
      ignore = true
    }
  }, [id])

  if (loading) {
    return <div className="py-16 text-center text-sm text-[#6A6A6A]">{t('common.loading')}</div>
  }

  if (error || !booking) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <p className="text-lg font-semibold text-[#222222]">{t('booking.unableToLoad')}</p>
        <p className="mt-2 text-sm text-[#6A6A6A]">{error || t('booking.notFound')}</p>
        <Link
          to="/trips"
          className="mt-6 inline-block rounded-lg bg-[#222222] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-black"
        >
          {t('booking.backToTrips')}
        </Link>
      </div>
    )
  }

  const { property, payments = [] } = booking
  const latestPayment = payments[0] ?? null
  const currency = latestPayment?.currency || 'EUR'
  const imageUrl = propertyImage(property)
  const fullAddress = [property?.address, property?.city, property?.country].filter(Boolean).join(', ')
  const mapsUrl =
    property?.latitude && property?.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${property.latitude},${property.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`

  const descriptionParagraphs = (property?.description || '').split(/\n\s*\n/).filter(Boolean)
  const visibleParagraphs = showFullDesc ? descriptionParagraphs : descriptionParagraphs.slice(0, 1)

  const paid = isPaid(booking)
  const showPay = canPay(booking)
  const showCancel = canGuestCancel(booking)

  const handleCopyAddress = () => {
    navigator.clipboard?.writeText(fullAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePay = async () => {
    setPaying(true)
    setNotice(null)
    try {
      const { data } = await api.post(`/bookings/${id}/pay`)
      setBooking(data.booking)
      setNotice({ type: 'success', text: data.message })
    } catch (err) {
      const fieldErrors = err.response?.data?.errors
      const msg = fieldErrors ? Object.values(fieldErrors)[0][0] : errorMessage(err)
      setNotice({ type: 'error', text: msg })
    } finally {
      setPaying(false)
    }
  }

  const handleCancel = async () => {
    setNotice(null)
    const { data } = await api.post(`/bookings/${id}/cancel`)
    setBooking(data.booking)
    setNotice({ type: 'success', text: data.message })
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 text-[#222222] sm:px-6">
      {/* Top Bar */}
      <div className="mb-6">
        <Link to="/trips" className="inline-flex items-center gap-2 text-sm font-medium text-[#222222] hover:underline">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {t('booking.allTrips')}
        </Link>
      </div>

      {/* Page Title + Status */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[28px] font-semibold tracking-tight text-[#222222] sm:text-[32px]">
              {t('booking.stayIn', { city: property?.city || t('booking.yourDestination') })}
            </h1>
            <BookingStatus status={booking.status} />
          </div>
          <p className="mt-1 text-sm text-[#6A6A6A]">
            {t('booking.reservationNumber', { id: booking.id })} ·{' '}
            {t('booking.bookedOn', { date: formatDay(booking.created_at, locale) })}
          </p>
        </div>
      </div>

      {notice && (
        <div className="mb-6">
          <Alert type={notice.type}>{notice.text}</Alert>
        </div>
      )}

      {/* Status Callout Banner */}
      {booking.status === 'pending' && (
        <div className="mb-8 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-950">
          <svg className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-semibold">{t('booking.bannerPendingTitle')}</p>
            <p className="mt-0.5 text-amber-900/80">{t('booking.bannerPendingText')}</p>
          </div>
        </div>
      )}

      {showPay && (
        <div className="mb-8 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-950">
          <svg className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-semibold">{t('booking.bannerConfirmedUnpaidTitle')}</p>
            <p className="mt-0.5 text-emerald-900/80">
              {t('booking.bannerConfirmedUnpaidText', { amount: formatMoney(booking.total_price, locale, currency) })}
            </p>
          </div>
        </div>
      )}

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[1fr_380px]">
        {/* LEFT COLUMN */}
        <div className="space-y-8">
          {/* Property Hero Image */}
          <div className="overflow-hidden rounded-2xl border border-[#EBEBEB] bg-neutral-100">
            <img src={imageUrl} alt={property?.title} className="aspect-16/10 w-full object-cover" />
          </div>

          {/* Property Title & Host */}
          <div className="border-b border-[#EBEBEB] pb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6A6A6A]">
              {property?.property_type} · {property?.city}, {property?.country}
            </p>
            <Link to={`/properties/${property?.id}`} className="mt-1 block text-2xl font-semibold text-[#222222] hover:underline">
              {property?.title}
            </Link>
            <p className="mt-2 text-sm text-[#6A6A6A]">
              {t('booking.propertySpecs', {
                guests: property?.max_guests ?? 0,
                bedrooms: property?.bedrooms ?? 0,
                beds: property?.beds ?? 0,
                bathrooms: property?.bathrooms ?? 0,
              })}
            </p>
            {property?.host && (
              <Link to={`/users/${property.host.id}`} className="mt-4 inline-flex items-center gap-3 hover:underline">
                <Avatar user={property.host} size="sm" />
                <span className="text-sm font-medium">
                  {t('booking.hostedBy', { name: property.host.first_name || property.host.name })}
                </span>
              </Link>
            )}
          </div>

          {/* Check-in / Check-out Split Card */}
          <div className="border-b border-[#EBEBEB] pb-8">
            <h2 className="mb-4 text-xl font-semibold">{t('booking.tripDetails')}</h2>
            <div className="grid grid-cols-1 divide-y divide-[#EBEBEB] rounded-xl border border-[#DDDDDD] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              <div className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#6A6A6A]">{t('booking.checkIn')}</p>
                <p className="mt-1 text-base font-semibold">
                  {formatDay(booking.check_in, locale, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                <p className="mt-0.5 text-xs text-[#6A6A6A]">{t('booking.checkInTime')}</p>
              </div>
              <div className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#6A6A6A]">{t('booking.checkOut')}</p>
                <p className="mt-1 text-base font-semibold">
                  {formatDay(booking.check_out, locale, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                <p className="mt-0.5 text-xs text-[#6A6A6A]">{t('booking.checkOutTime')}</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs font-medium text-[#6A6A6A]">{t('booking.guests')}</p>
                <p className="mt-0.5 text-sm font-semibold">{t('booking.guestsCount', { count: booking.guests })}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-[#6A6A6A]">{t('booking.duration')}</p>
                <p className="mt-0.5 text-sm font-semibold">
                  {t(booking.nights === 1 ? 'booking.night' : 'booking.nights', { count: booking.nights })}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-[#6A6A6A]">{t('booking.confirmationCode')}</p>
                <p className="mt-0.5 font-mono text-sm font-semibold">RES-{booking.id}</p>
              </div>
            </div>
          </div>

          {/* Getting There / Address */}
          <div className="border-b border-[#EBEBEB] pb-8">
            <h2 className="mb-3 text-xl font-semibold">{t('booking.gettingThere')}</h2>
            <p className="text-sm font-medium text-[#222222]">{fullAddress}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleCopyAddress}
                className="rounded-lg border border-[#222222] px-4 py-2 text-sm font-semibold transition hover:bg-neutral-50"
              >
                {copied ? t('booking.copied') : t('booking.copyAddress')}
              </button>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#DDDDDD] px-4 py-2 text-sm font-semibold transition hover:bg-neutral-50"
              >
                {t('booking.getDirections')}
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>

          {/* About this place */}
          {descriptionParagraphs.length > 0 && (
            <div>
              <h2 className="mb-3 text-xl font-semibold">{t('booking.aboutSpace')}</h2>
              <div className="space-y-3 text-sm leading-6 text-[#484848]">
                {visibleParagraphs.map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))}
              </div>
              {descriptionParagraphs.length > 1 && (
                <button
                  type="button"
                  onClick={() => setShowFullDesc((v) => !v)}
                  className="mt-3 text-sm font-semibold underline underline-offset-2 hover:text-black"
                >
                  {showFullDesc ? t('booking.showLess') : t('booking.showMore')}
                </button>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN — STICKY SUMMARY CARD */}
        <aside className="lg:sticky lg:top-8">
          <div className="rounded-2xl border border-[#DDDDDD] bg-white p-6 shadow-[0_6px_16px_rgba(0,0,0,0.08)]">
            {/* Mini Property Preview */}
            <div className="flex gap-4 border-b border-[#EBEBEB] pb-5">
              <img src={imageUrl} alt={property?.title} className="h-20 w-24 shrink-0 rounded-xl object-cover" />
              <div className="min-w-0">
                <p className="text-xs capitalize text-[#6A6A6A]">{property?.property_type}</p>
                <p className="truncate text-sm font-semibold text-[#222222]">{property?.title}</p>
                <p className="mt-1 text-xs text-[#6A6A6A]">
                  {property?.city}, {property?.country}
                </p>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="border-b border-[#EBEBEB] py-5">
              <h3 className="mb-4 text-lg font-semibold">{t('booking.priceDetails')}</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-[#222222]">
                  <span className="underline decoration-[#DDDDDD] underline-offset-4">
                    {formatMoney(booking.price_per_night, locale, currency)} ×{' '}
                    {t(booking.nights === 1 ? 'booking.night' : 'booking.nights', { count: booking.nights })}
                  </span>
                  <span>{formatMoney(booking.total_price, locale, currency)}</span>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-[#EBEBEB] pt-4 text-base font-semibold">
                <span>
                  {t('booking.total')} ({currency})
                </span>
                <span>{formatMoney(booking.total_price, locale, currency)}</span>
              </div>
            </div>

            {/* Payment Info */}
            {latestPayment && (
              <div className="border-b border-[#EBEBEB] py-5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{t('booking.paymentStatus')}</span>
                  <BookingStatus status={latestPayment.status} type="payment" />
                </div>
                <div className="mt-3 space-y-1.5 text-xs text-[#6A6A6A]">
                  <div className="flex justify-between">
                    <span>{t('booking.paymentMethod')}</span>
                    <span className="font-medium capitalize text-[#222222]">{latestPayment.provider}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('booking.paymentId')}</span>
                    <span className="font-mono text-[#222222]">#{latestPayment.id}</span>
                  </div>
                  {latestPayment.transaction_id && (
                    <div className="flex justify-between gap-2">
                      <span className="shrink-0">{t('booking.transaction')}</span>
                      <span className="truncate font-mono text-[#222222]">{latestPayment.transaction_id}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            {(showPay || showCancel) && (
              <div className="mt-5 space-y-3">
                {showPay && (
                  <Button type="button" loading={paying} onClick={handlePay} className="w-full">
                    {t('booking.payAmount', { amount: formatMoney(booking.total_price, locale, currency) })}
                  </Button>
                )}

                {showCancel && (
                  <Button type="button" variant="outline" onClick={() => setCancelOpen(true)} className="w-full">
                    {t('booking.cancelReservation')}
                  </Button>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      <CancelBookingModal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancel}
        text={paid ? t('booking.cancelPaidText') : t('booking.cancelText')}
      />
    </div>
  )
}
