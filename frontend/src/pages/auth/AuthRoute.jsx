import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useAuthModal } from '../../context/AuthModalContext.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'
import Home from '../Home.jsx'

/**
 * /login, /signup, /forgot-password: like Airbnb, these open the dialog over the home page.
 * ProtectedRoute sends logged-out visitors to /login?redirect=/where/they/were.
 */
export default function AuthRoute({ step = 'email' }) {
  const { openAuthModal } = useAuthModal()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  useEffect(() => {
    const redirect = params.get('redirect')
    openAuthModal({ step, redirect, notice: redirect ? t('auth.loginToContinue') : undefined })
    navigate('/', { replace: true })
    // run once per visit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <Home />
}
