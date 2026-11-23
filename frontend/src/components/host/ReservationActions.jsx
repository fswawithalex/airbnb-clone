import { useState } from 'react'
import { useI18n } from '../../i18n/I18nContext.jsx'
import api, { errorMessage } from '../../lib/api.js'
import { toISODate } from '../../lib/booking.js'
import CancelBookingModal from '../booking/CancelBookingModal.jsx'
import Button from '../ui/Button.jsx'

/** Approve / Decline / Cancel controls for a single host reservation. */
export default function ReservationActions({ booking, onUpdated, onError }) {
  const { t } = useI18n()
  const [approving, setApproving] = useState(false)
  const [modal, setModal] = useState(null) // 'reject' | 'cancel' | null

  const canCancel = booking.status === 'confirmed' && booking.check_in > toISODate(new Date())

  const handleApprove = async () => {
    setApproving(true)
    onError?.('')
    try {
      const { data } = await api.post(`/host/reservations/${booking.id}/approve`)
      onUpdated(data.booking, data.message)
    } catch (err) {
      const fieldErrors = err.response?.data?.errors
      onError?.(fieldErrors ? Object.values(fieldErrors)[0][0] : errorMessage(err))
    } finally {
      setApproving(false)
    }
  }

  const handleModalConfirm = async () => {
    const endpoint = modal === 'reject' ? 'reject' : 'cancel'
    const { data } = await api.post(`/host/reservations/${booking.id}/${endpoint}`)
    onUpdated(data.booking, data.message)
  }

  if (booking.status !== 'pending' && !canCancel) return null

  return (
    <>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-[#EBEBEB] pt-4">
        {booking.status === 'pending' && (
          <>
            <Button type="button" variant="dark" loading={approving} onClick={handleApprove} className="min-h-10 px-4 py-2 text-sm">
              {t('host.accept')}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={approving}
              onClick={() => setModal('reject')}
              className="min-h-10 px-4 py-2 text-sm"
            >
              {t('host.decline')}
            </Button>
          </>
        )}

        {canCancel && (
          <Button
            type="button"
            variant="danger"
            onClick={() => setModal('cancel')}
            className="min-h-10 px-4 py-2 text-sm"
          >
            {t('booking.cancelReservation')}
          </Button>
        )}
      </div>

      <CancelBookingModal
        open={Boolean(modal)}
        onClose={() => setModal(null)}
        onConfirm={handleModalConfirm}
        title={modal === 'reject' ? t('host.declineTitle') : t('host.cancelTitle')}
        text={modal === 'reject' ? t('host.declineText') : t('host.cancelText')}
        confirmLabel={modal === 'reject' ? t('host.declineConfirm') : t('booking.cancelConfirm')}
      />
    </>
  )
}
