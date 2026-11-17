import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useAuthModal } from '../../context/AuthModalContext.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'
import api, { errorMessage, validationErrors } from '../../lib/api.js'
import Alert from '../../components/ui/Alert.jsx'
import Button from '../../components/ui/Button.jsx'
import FloatingInput from '../../components/ui/FloatingInput.jsx'

/** Opened from the email link: /reset-password?token=...&email=... */
export default function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { openAuthModal } = useAuthModal()
  const { t } = useI18n()
  const token = params.get('token')
  const email = params.get('email') ?? ''
  const [form, setForm] = useState({ password: '', password_confirmation: '' })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value })

  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})
    setMessage(null)
    try {
      await api.post('/auth/reset-password', { ...form, email, token })
      navigate('/', { replace: true })
      openAuthModal({ step: 'login', email, notice: t('auth.resetDone') })
    } catch (error) {
      const fields = validationErrors(error)
      setErrors(fields)
      if (!Object.keys(fields).length) setMessage(errorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  const requestNew = () => openAuthModal({ step: 'forgot', email })

  return (
    <div className="mx-auto w-full max-w-[568px] rounded-2xl border border-[#DDDDDD]">
      <div className="flex min-h-16 items-center justify-center border-b border-[#EBEBEB] px-6">
        <h1 className="text-base font-semibold text-[#222222]">{t('reset.title')}</h1>
      </div>
      <div className="p-6">
        {!token ? (
          <div className="space-y-4">
            <Alert>{t('reset.invalid')}</Alert>
            <Button type="button" variant="dark" onClick={requestNew}>
              {t('reset.requestNew')}
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-4">
            <p className="truncate text-sm text-[#6A6A6A]">{email}</p>
            <Alert>{message ?? errors.email}</Alert>
            <FloatingInput label={t('reset.newPassword')} name="password" type="password" autoComplete="new-password" value={form.password} onChange={update} error={errors.password} />
            <FloatingInput label={t('reset.confirm')} name="password_confirmation" type="password" autoComplete="new-password" value={form.password_confirmation} onChange={update} error={errors.password_confirmation} />
            {!errors.password && <p className="text-xs text-[#6A6A6A]">{t('auth.passwordHint')}</p>}
            <Button loading={submitting} className="w-full">
              {t('reset.save')}
            </Button>
            {errors.email && (
              <button type="button" onClick={requestNew} className="text-sm font-semibold text-[#222222] underline">
                {t('reset.requestNew')}
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
