import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../../context/AuthContext.jsx'
import { useAuthModal } from '../../context/AuthModalContext.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'
import api, { errorMessage, validationErrors } from '../../lib/api.js'
import { formatMoney, overlapsAny } from '../../lib/booking.js'
import Alert from '../ui/Alert.jsx'
import Button from '../ui/Button.jsx'
import BookingConfirmationModal from './BookingConfirmationModal.jsx'
import DateRangePicker from './DateRangePicker.jsx'
import GuestSelector from './GuestSelector.jsx'
import PriceBreakdown from './PriceBreakdown.jsx'

/** Sticky "Reserve" card on the listing page. */
export default function BookingCard({ property }) {
  const { t, locale } = useI18n()
  const { user } = useAuth()
  const { openAuthModal } = useAuthModal()

  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(1)
  const [unavailable, setUnavailable] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [booking, setBooking] = useState(null)

  const loadUnavailable = () =>
    api
      .get(`/properties/${property.id}/unavailable-dates`)
      .then((res) => setUnavailable(res.data.ranges))
      .catch(() => setUnavailable([]))

  useEffect(() => {
    loadUnavailable()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property.id])

  const isOwnListing = user && Number(user.id) === Number(property.host_id)
  const datesTaken = checkIn && checkOut && overlapsAny(checkIn, checkOut, unavailable)
  const ready = checkIn && checkOut && checkOut > checkIn && !datesTaken

  const handleReserve = async () => {
    if (!user) {
      openAuthModal({ redirect: `/properties/${property.id}` })
      return
    }
    if (!ready) return

    setError('')
    setSubmitting(true)
    try {
      const { data } = await api.post('/bookings', {
        property_id: property.id,
        check_in: checkIn,
        check_out: checkOut,
        guests,
      })
      setBooking(data.booking)
      setCheckIn('')
      setCheckOut('')
      setGuests(1)
      loadUnavailable()
    } catch (err) {
      const fields = validationErrors(err)
      setError(Object.values(fields)[0] ?? errorMessage(err))
      if (err.response?.status === 422) loadUnavailable()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="sticky top-24 rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
      <div className="flex items-baseline justify-between">
        <div>
          <span className="text-[22px] font-semibold">{formatMoney(property.price_per_night, locale)}</span>{' '}
          <span className="text-base text-[#222222]">{t('booking.perNight')}</span>
        </div>
      </div>

      {isOwnListing ? (
        <div className="mt-5">
          <Alert type="info">{t('booking.ownListing')}</Alert>
          <Link to="/host/reservations" className="mt-4 block text-center text-sm font-semibold underline">
            {t('menu.reservations')}
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-5">
            <DateRangePicker
              checkIn={checkIn}
              checkOut={checkOut}
              onCheckInChange={(value) => { setCheckIn(value); setError('') }}
              onCheckOutChange={(value) => { setCheckOut(value); setError('') }}
              unavailable={unavailable}
            />
            <GuestSelector guests={guests} maxGuests={Number(property.max_guests) || 1} onChange={setGuests} />
          </div>

          {datesTaken && <p className="mt-3 text-sm text-[#C13515]">{t('booking.datesTaken')}</p>}
          {error && <div className="mt-3"><Alert>{error}</Alert></div>}

          <Button
            type="button"
            onClick={handleReserve}
            loading={submitting}
            disabled={Boolean(user) && !ready}
            className="mt-4 w-full"
          >
            {!user ? t('booking.loginToReserve') : checkIn && checkOut ? t('booking.reserve') : t('booking.selectDates')}
          </Button>

          {ready && <p className="mt-3 text-center text-sm text-[#6A6A6A]">{t('booking.notChargedYet')}</p>}

          <PriceBreakdown checkIn={checkIn} checkOut={checkOut} pricePerNight={property.price_per_night} />
        </>
      )}

      <BookingConfirmationModal booking={booking} onClose={() => setBooking(null)} />
    </div>
  )
}
