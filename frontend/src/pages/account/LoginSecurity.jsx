import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../context/AuthContext.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'
import api from '../../lib/api.js'
import Alert from '../../components/ui/Alert.jsx'
import Button from '../../components/ui/Button.jsx'
import FloatingInput from '../../components/ui/FloatingInput.jsx'
import { InfoCard, SettingsHeader, SettingsLayout, SettingsRow } from './parts.jsx'
import icons from './icons.jsx'
import useFormRequest from './useFormRequest.js'

/** /account-settings/login-and-security — password and account deactivation. */
export default function LoginSecurity() {
  const { forget } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(null)
  const empty = { current_password: '', password: '', password_confirmation: '' }
  const [form, setForm] = useState(empty)
  const [deletePassword, setDeletePassword] = useState('')
  const [done, setDone] = useState(null)
  const request = useFormRequest()
  const { errors } = request

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value })
  const start = (row) => {
    request.reset()
    setDone(null)
    setForm(empty)
    setDeletePassword('')
    setEditing(row)
  }

  const savePassword = async (event) => {
    event.preventDefault()
    if (await request.run(() => api.put('/user/password', form))) {
      setEditing(null)
      setDone(t('security.updated'))
    }
  }

  const deactivate = async (event) => {
    event.preventDefault()
    if (await request.run(() => api.delete('/user', { data: { password: deletePassword } }))) {
      forget()
      navigate('/', { replace: true })
    }
  }

  return (
    <div className="mx-auto max-w-[1080px]">
      <SettingsHeader title={t('account.security')} />
      <SettingsLayout
        aside={
          <InfoCard icon={icons.shield} title={t('security.infoTitle')}>
            {t('security.infoText')}
          </InfoCard>
        }
      >
        <h2 className="text-2xl font-semibold text-[#222222]">{t('security.login')}</h2>
        <div className="mt-2">
          <Alert type="success">{done}</Alert>
        </div>
        <SettingsRow
          title={t('security.password')}
          value="••••••••"
          actionLabel={t('security.update')}
          editing={editing === 'password'}
          onEdit={() => start('password')}
          onCancel={() => setEditing(null)}
          disabled={editing === 'deactivate'}
        >
          <form onSubmit={savePassword} noValidate className="space-y-4">
            <Alert>{request.message}</Alert>
            <FloatingInput label={t('security.current')} name="current_password" type="password" autoComplete="current-password" value={form.current_password} onChange={update} error={errors.current_password} />
            <FloatingInput label={t('security.new')} name="password" type="password" autoComplete="new-password" value={form.password} onChange={update} error={errors.password} />
            <FloatingInput label={t('security.confirm')} name="password_confirmation" type="password" autoComplete="new-password" value={form.password_confirmation} onChange={update} error={errors.password_confirmation} />
            <Button variant="dark" loading={request.submitting}>
              {t('security.updatePassword')}
            </Button>
          </form>
        </SettingsRow>

        <h2 className="mt-12 text-2xl font-semibold text-[#222222]">{t('security.account')}</h2>
        <SettingsRow
          title={t('security.deactivate')}
          value={t('security.deactivateText')}
          hint={t('security.deactivateText')}
          actionLabel={t('security.deactivateBtn')}
          editing={editing === 'deactivate'}
          onEdit={() => start('deactivate')}
          onCancel={() => setEditing(null)}
          disabled={editing === 'password'}
        >
          <form onSubmit={deactivate} noValidate className="space-y-4">
            <Alert>{request.message}</Alert>
            <FloatingInput
              label={t('security.confirmPassword')}
              type="password"
              autoComplete="current-password"
              value={deletePassword}
              onChange={(event) => setDeletePassword(event.target.value)}
              error={errors.password}
            />
            <Button variant="danger" loading={request.submitting}>
              {t('security.deactivateConfirm')}
            </Button>
          </form>
        </SettingsRow>
      </SettingsLayout>
    </div>
  )
}
