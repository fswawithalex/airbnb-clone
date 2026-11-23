import { useState } from 'react'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { errorMessage } from '../../lib/api.js'
import Alert from '../ui/Alert.jsx'
import Button from '../ui/Button.jsx'
import Modal from '../ui/Modal.jsx'

/**
 * "Are you sure?" dialog for cancelling / declining a reservation.
 * onConfirm must return a promise; errors from the API are shown inside the dialog.
 */
export default function CancelBookingModal({ open, title, text, confirmLabel, onConfirm, onClose }) {
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const close = () => {
    if (loading) return
    setError('')
    onClose()
  }

  const confirm = async () => {
    setLoading(true)
    setError('')
    try {
      await onConfirm()
      onClose()
    } catch (err) {
      const fieldErrors = err.response?.data?.errors
      setError(fieldErrors ? Object.values(fieldErrors)[0][0] : errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      title={title ?? t('booking.cancelTitle')}
      onClose={close}
      footer={
        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <Button type="button" variant="danger" loading={loading} onClick={confirm} className="flex-1">
            {confirmLabel ?? t('booking.cancelConfirm')}
          </Button>
          <Button type="button" variant="outline" onClick={close} disabled={loading} className="flex-1">
            {t('booking.keep')}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-[#222222]">{text ?? t('booking.cancelText')}</p>
      {error && <div className="mt-4"><Alert>{error}</Alert></div>}
    </Modal>
  )
}
