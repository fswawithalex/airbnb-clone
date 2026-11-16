import axios from 'axios'
import { getLocale } from '../i18n/locale.js'

// Shared HTTP client for the Laravel API. Import it everywhere instead of calling fetch/axios directly,
// so auth headers/cookies and error handling can be added in one place later.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api',
  headers: {
    Accept: 'application/json',
  },
})

// --- Auth token (Sanctum personal access token, see docs/api-auth.md) ---
const TOKEN_KEY = 'auth_token'

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // private mode / storage blocked: the session just won't survive a reload
  }
}

// Every request carries the token when the user is logged in.
api.interceptors.request.use((config) => {
  // Laravel answers validation errors / emails in this language (en | ro | ru)
  config.headers['Accept-Language'] = getLocale()
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Token expired or revoked (logout on another device, account deleted):
// forget it and tell AuthContext, which resets the user.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && getToken()) {
      setToken(null)
      window.dispatchEvent(new Event('auth:logout'))
    }
    return Promise.reject(error)
  },
)

/**
 * Laravel 422 response -> { field: 'first message' } for showing under inputs.
 * Usage: setErrors(validationErrors(err))
 */
export function validationErrors(error) {
  const errors = error.response?.data?.errors
  if (!errors) return {}
  return Object.fromEntries(Object.entries(errors).map(([field, messages]) => [field, messages[0]]))
}

/** One human-readable message for any failed request. */
export function errorMessage(error) {
  return error.response?.data?.message ?? error.message ?? 'Something went wrong.'
}

export default api
