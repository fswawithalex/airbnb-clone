import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import en from './en.js'
import ro from './ro.js'
import ru from './ru.js'
import { getLocale, saveLocale } from './locale.js'

export { LANGUAGES } from './languages.js'

/**
 * Tiny i18n: t('auth.continue'), t('account.greeting', { name: 'Ana' }).
 * Missing keys fall back to English, then to the key itself.
 * Add a string: put the same key in en.js, ro.js and ru.js.
 */

const DICTIONARIES = { en, ro, ru }

function translate(locale, key, vars) {
  const text = DICTIONARIES[locale]?.[key] ?? en[key] ?? key
  if (!vars) return text
  return text.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? vars[name] : match))
}

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(getLocale)

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((code) => {
    if (!DICTIONARIES[code]) return
    saveLocale(code)
    setLocaleState(code)
  }, [])

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: (key, vars) => translate(locale, key, vars),
      formatDate: (value, options = { day: 'numeric', month: 'long', year: 'numeric' }) =>
        value ? new Intl.DateTimeFormat(locale, options).format(new Date(value)) : '',
    }),
    [locale, setLocale],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

// eslint-disable-next-line react/only-export-components
export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n() must be used inside <I18nProvider>')
  return context
}
