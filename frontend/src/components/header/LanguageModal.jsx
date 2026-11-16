import { LANGUAGES, useI18n } from '../../i18n/I18nContext.jsx'
import Modal from '../ui/Modal.jsx'

/** Globe button dialog: pick en / ro / ru, like Airbnb's "Language and region". */
export default function LanguageModal({ open, onClose }) {
  const { t, locale, setLocale } = useI18n()

  const choose = (code) => {
    setLocale(code)
    onClose()
  }

  return (
    <Modal open={open} title={t('lang.title')} onClose={onClose} size="lg">
      <h3 className="mb-6 text-[22px] font-semibold text-[#222222]">{t('lang.choose')}</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {LANGUAGES.map((language) => {
          const active = language.code === locale
          return (
            <button
              key={language.code}
              type="button"
              lang={language.code}
              aria-pressed={active}
              onClick={() => choose(language.code)}
              className={`rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-[#F7F7F7] ${active ? 'ring-1 ring-[#222222]' : ''}`}
            >
              <span className="block text-[#222222]">{language.label}</span>
              <span className="block text-[#6A6A6A]">{language.region}</span>
            </button>
          )
        })}
      </div>
    </Modal>
  )
}
