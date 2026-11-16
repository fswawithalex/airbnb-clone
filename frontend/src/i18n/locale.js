// Current language, shared by I18nContext (UI) and lib/api.js (Accept-Language header).
export const SUPPORTED_LOCALES = ['en', 'ro', 'ru']
const STORAGE_KEY = 'locale'

export function getLocale() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (SUPPORTED_LOCALES.includes(saved)) return saved
  } catch {
    // storage blocked: fall through to the browser language
  }
  const browser = (navigator.language || 'en').slice(0, 2)
  return SUPPORTED_LOCALES.includes(browser) ? browser : 'en'
}

export function saveLocale(code) {
  try {
    localStorage.setItem(STORAGE_KEY, code)
  } catch {
    // only this tab keeps the choice
  }
}
