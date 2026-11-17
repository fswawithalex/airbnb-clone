import { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'
import api from '../../lib/api.js'
import Alert from '../../components/ui/Alert.jsx'
import Button from '../../components/ui/Button.jsx'
import FloatingInput, { FieldGroup } from '../../components/ui/FloatingInput.jsx'
import { InfoCard, SettingsHeader, SettingsLayout, SettingsRow } from './parts.jsx'
import icons from './icons.jsx'
import useFormRequest from './useFormRequest.js'

/** /account-settings/personal-info — one editable row at a time, like Airbnb. */
export default function PersonalInfo() {
  const { user, setUser } = useAuth()
  const { t } = useI18n()
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const request = useFormRequest()

  const start = (row) => {
    request.reset()
    setForm({ first_name: user.first_name ?? '', last_name: user.last_name ?? '', email: user.email, phone: user.phone ?? '' })
    setEditing(row)
  }
  const cancel = () => setEditing(null)
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value })

  const save = (fields) => async (event) => {
    event.preventDefault()
    const body = Object.fromEntries(fields.map((field) => [field, form[field] === '' && field === 'phone' ? null : form[field]]))
    const result = await request.run(() => api.put('/user/profile', body))
    if (result) {
      setUser(result.data.data)
      setEditing(null)
    }
  }

  const { errors } = request
  const rowProps = (row) => ({
    editing: editing === row,
    onEdit: () => start(row),
    onCancel: cancel,
    disabled: editing !== null && editing !== row,
  })
  const legalName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.name

  return (
    <div className="mx-auto max-w-[1080px]">
      <SettingsHeader title={t('account.personalInfo')} />
      <SettingsLayout
        aside={
          <>
            <InfoCard icon={icons.lock} title={t('personal.info1Title')}>
              {t('personal.info1Text')}
            </InfoCard>
            <InfoCard icon={icons.eye} title={t('personal.info2Title')}>
              {t('personal.info2Text')}
            </InfoCard>
          </>
        }
      >
        <SettingsRow title={t('personal.legalName')} value={legalName} hint={t('auth.nameHint')} {...rowProps('name')}>
          <form onSubmit={save(['first_name', 'last_name'])} noValidate className="space-y-4">
            <Alert>{request.message}</Alert>
            <FieldGroup errors={[errors.first_name, errors.last_name]}>
              <FloatingInput grouped position="first" label={t('auth.firstName')} name="first_name" autoComplete="given-name" value={form.first_name} onChange={update} error={errors.first_name} />
              <FloatingInput grouped position="last" label={t('auth.lastName')} name="last_name" autoComplete="family-name" value={form.last_name} onChange={update} error={errors.last_name} />
            </FieldGroup>
            <Button variant="dark" loading={request.submitting}>
              {t('common.save')}
            </Button>
          </form>
        </SettingsRow>

        <SettingsRow title={t('personal.email')} value={user.email} hint={t('personal.emailHint')} {...rowProps('email')}>
          <form onSubmit={save(['email'])} noValidate className="space-y-4">
            <Alert>{request.message}</Alert>
            <FloatingInput label={t('auth.email')} name="email" type="email" autoComplete="email" value={form.email} onChange={update} error={errors.email} />
            <Button variant="dark" loading={request.submitting}>
              {t('common.save')}
            </Button>
          </form>
        </SettingsRow>

        <SettingsRow
          title={t('personal.phone')}
          value={user.phone || t('personal.phoneHint')}
          hint={t('personal.phoneHint')}
          actionLabel={user.phone ? t('common.edit') : t('common.add')}
          {...rowProps('phone')}
        >
          <form onSubmit={save(['phone'])} noValidate className="space-y-4">
            <Alert>{request.message}</Alert>
            <FloatingInput label={t('personal.phone')} name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={update} error={errors.phone} />
            <Button variant="dark" loading={request.submitting}>
              {t('common.save')}
            </Button>
          </form>
        </SettingsRow>
      </SettingsLayout>
    </div>
  )
}
