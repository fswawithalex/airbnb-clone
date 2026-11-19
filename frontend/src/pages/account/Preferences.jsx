import { useState } from 'react'
import { LANGUAGES, useI18n } from '../../i18n/I18nContext.jsx'
import Button from '../../components/ui/Button.jsx'
import { InfoCard, SettingsHeader, SettingsLayout, SettingsRow } from './parts.jsx'
import icons from './icons.jsx'

/** /account-settings/preferences — preferred language (saved in this browser). */
export default function Preferences() {
  const { t, locale, setLocale } = useI18n()
  const [editing, setEditing] = useState(false)
  const [choice, setChoice] = useState(locale)
  const current = LANGUAGES.find((language) => language.code === locale)

  const save = (event) => {
    event.preventDefault()
    setLocale(choice)
    setEditing(false)
  }

  return (
    <div className="mx-auto max-w-[1080px]">
      <SettingsHeader title={t('account.preferences')} />
      <SettingsLayout
        aside={
          <InfoCard icon={icons.globe} title={t('lang.title')}>
            {t('account.preferencesDesc')}
          </InfoCard>
        }
      >
        <SettingsRow
          title={t('prefs.language')}
          value={current?.label}
          editing={editing}
          onEdit={() => {
            setChoice(locale)
            setEditing(true)
          }}
          onCancel={() => setEditing(false)}
        >
          <form onSubmit={save} className="space-y-4">
            <select
              aria-label={t('prefs.language')}
              value={choice}
              onChange={(event) => setChoice(event.target.value)}
              className="block h-14 w-full rounded-lg border border-[#B0B0B0] bg-white px-3 text-base text-[#222222] outline-none focus:ring-2 focus:ring-[#222222]"
            >
              {LANGUAGES.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.label}
                </option>
              ))}
            </select>
            <Button variant="dark">{t('common.save')}</Button>
          </form>
        </SettingsRow>
      </SettingsLayout>
    </div>
  )
}
