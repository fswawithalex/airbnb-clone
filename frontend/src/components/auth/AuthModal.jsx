import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../context/AuthContext.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'
import api, { errorMessage, validationErrors } from '../../lib/api.js'
import { safeRedirect } from '../../lib/redirect.js'
import { todayISO } from '../../lib/dates.js'
import Alert from '../ui/Alert.jsx'
import Button from '../ui/Button.jsx'
import FloatingInput, { FieldGroup } from '../ui/FloatingInput.jsx'
import Modal from '../ui/Modal.jsx'

/**
 * Airbnb flow in one dialog:
 *   email ─┬─ account exists → login (password) ─ forgot → sent
 *          └─ new email      → signup ("Finish signing up")
 */
export default function AuthModal({ step: initialStep = 'email', redirect, notice, email: initialEmail = '', onClose }) {
  const { t } = useI18n()
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(initialStep)
  const [form, setForm] = useState({ email: initialEmail, password: '', first_name: '', last_name: '', birth_date: '' })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState(null)
  const [sentText, setSentText] = useState(null)
  const [busy, setBusy] = useState(false)

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value })

  const go = (next) => {
    setErrors({})
    setMessage(null)
    setStep(next)
  }

  const run = async (request) => {
    setBusy(true)
    setErrors({})
    setMessage(null)
    try {
      return await request()
    } catch (error) {
      const fields = validationErrors(error)
      setErrors(fields)
      if (!Object.keys(fields).length) setMessage(errorMessage(error))
      return undefined
    } finally {
      setBusy(false)
    }
  }

  const finish = () => {
    onClose()
    if (redirect) navigate(safeRedirect(redirect), { replace: true })
  }

  const submitEmail = async (event) => {
    event.preventDefault()
    const result = await run(() => api.post('/auth/check-email', { email: form.email }))
    if (result) go(result.data.exists ? 'login' : 'signup')
  }

  const submitLogin = async (event) => {
    event.preventDefault()
    if (await run(() => login(form.email, form.password))) finish()
  }

  const submitSignup = async (event) => {
    event.preventDefault()
    const { email, password, first_name, last_name, birth_date } = form
    if (await run(() => register({ email, password, first_name, last_name, birth_date }))) finish()
  }

  const submitForgot = async (event) => {
    event.preventDefault()
    const result = await run(() => api.post('/auth/forgot-password', { email: form.email }))
    if (result) {
      setSentText(result.data.message)
      go('sent')
    }
  }

  const titles = {
    email: t('auth.title'),
    login: t('auth.loginTitle'),
    signup: t('auth.finishTitle'),
    forgot: t('auth.forgotTitle'),
    sent: t('auth.forgotTitle'),
  }
  const backTo = { login: 'email', signup: 'email', forgot: initialStep === 'forgot' ? null : 'login', sent: null }[step]

  return (
    <Modal open title={titles[step]} onClose={onClose} onBack={backTo ? () => go(backTo) : undefined}>
      {step === 'email' && (
        <form onSubmit={submitEmail} noValidate>
          <h3 className="mb-6 text-[22px] font-semibold text-[#222222]">{t('auth.welcome')}</h3>
          <div className="space-y-4">
            <Alert type="info">{notice}</Alert>
            <Alert>{message}</Alert>
            <FloatingInput label={t('auth.email')} name="email" type="email" autoComplete="email" value={form.email} onChange={update} error={errors.email} />
            <Button loading={busy} className="w-full">
              {t('auth.continue')}
            </Button>
          </div>
        </form>
      )}

      {step === 'login' && (
        <form onSubmit={submitLogin} noValidate className="space-y-4">
          <Alert>{message}</Alert>
          <p className="truncate text-sm text-[#6A6A6A]">{form.email}</p>
          <FloatingInput label={t('auth.password')} name="password" type="password" autoComplete="current-password" value={form.password} onChange={update} error={errors.password ?? errors.email} />
          <Button loading={busy} className="w-full">
            {t('auth.continue')}
          </Button>
          <button type="button" onClick={() => go('forgot')} className="text-sm font-semibold text-[#222222] underline">
            {t('auth.forgot')}
          </button>
        </form>
      )}

      {step === 'signup' && (
        <form onSubmit={submitSignup} noValidate className="space-y-6">
          <Alert>{message}</Alert>
          <section>
            <h4 className="mb-2 text-base font-semibold text-[#222222]">{t('auth.legalName')}</h4>
            <FieldGroup errors={[errors.first_name, errors.last_name]}>
              <FloatingInput grouped position="first" label={t('auth.firstName')} name="first_name" autoComplete="given-name" value={form.first_name} onChange={update} error={errors.first_name} />
              <FloatingInput grouped position="last" label={t('auth.lastName')} name="last_name" autoComplete="family-name" value={form.last_name} onChange={update} error={errors.last_name} />
            </FieldGroup>
            <p className="mt-2 text-xs text-[#6A6A6A]">{t('auth.nameHint')}</p>
          </section>

          <section>
            <h4 className="mb-2 text-base font-semibold text-[#222222]">{t('auth.birthdate')}</h4>
            <FloatingInput
              label={t('auth.birthdate')}
              name="birth_date"
              type="date"
              autoComplete="bday"
              max={todayISO()}
              value={form.birth_date}
              onChange={update}
              error={errors.birth_date}
            />
            <p className="mt-2 text-xs text-[#6A6A6A]">{t('auth.birthdateHint')}</p>
          </section>

          <section>
            <h4 className="mb-2 text-base font-semibold text-[#222222]">{t('auth.contactInfo')}</h4>
            <FloatingInput label={t('auth.email')} name="email" type="email" autoComplete="email" value={form.email} onChange={update} error={errors.email} />
            <p className="mt-2 text-xs text-[#6A6A6A]">{t('auth.emailHint')}</p>
          </section>

          <section>
            <h4 className="mb-2 text-base font-semibold text-[#222222]">{t('auth.password')}</h4>
            <FloatingInput label={t('auth.password')} name="password" type="password" autoComplete="new-password" value={form.password} onChange={update} error={errors.password} />
            {!errors.password && <p className="mt-2 text-xs text-[#6A6A6A]">{t('auth.passwordHint')}</p>}
          </section>

          <p className="text-xs leading-5 text-[#222222]">{t('auth.terms')}</p>
          <Button loading={busy} className="w-full">
            {t('auth.agree')}
          </Button>
        </form>
      )}

      {step === 'forgot' && (
        <form onSubmit={submitForgot} noValidate className="space-y-4">
          <p className="text-base text-[#6A6A6A]">{t('auth.forgotText')}</p>
          <Alert>{message}</Alert>
          <FloatingInput label={t('auth.email')} name="email" type="email" autoComplete="email" value={form.email} onChange={update} error={errors.email} />
          <Button loading={busy} className="w-full">
            {t('auth.sendLink')}
          </Button>
        </form>
      )}

      {step === 'sent' && (
        <div className="space-y-6">
          <Alert type="success">{sentText}</Alert>
          <Button type="button" variant="dark" className="w-full" onClick={() => go('email')}>
            {t('auth.continue')}
          </Button>
        </div>
      )}
    </Modal>
  )
}
