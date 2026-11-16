import { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useAuthModal } from '../../context/AuthModalContext.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { errorMessage } from '../../lib/api.js'
import Alert from '../../components/ui/Alert.jsx'
import Button from '../../components/ui/Button.jsx'

/**
 * /become-a-host — switch a guest account to host (POST /api/user/become-host).
 * Only changes the user's role; listings and the host dashboard belong to the properties module.
 */
export default function BecomeHost() {
  const { user, becomeHost } = useAuth()
  const { openAuthModal } = useAuthModal()
  const { t } = useI18n()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [justSwitched, setJustSwitched] = useState(false)

  const start = async () => {
    if (!user) {
      openAuthModal({ redirect: '/become-a-host', notice: t('hosting.loginFirst') })
      return
    }
    setBusy(true)
    setError(null)
    try {
      await becomeHost()
      setJustSwitched(true)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto grid max-w-[1080px] items-center gap-12 py-8 md:grid-cols-2">
      <div>
        <h1 className="text-[44px] font-semibold leading-[1.1] tracking-tight text-[#222222] md:text-[56px]">
          <span className="text-brand">{t('hosting.title')}</span>
        </h1>
        <p className="mt-6 text-lg text-[#222222]">{t('hosting.text')}</p>
        <div className="mt-8 max-w-sm space-y-4">
          <Alert>{error}</Alert>
          {justSwitched && <Alert type="success">{t('hosting.done')}</Alert>}
          {user && user.role !== 'guest' ? (
            !justSwitched && <Alert type="info">{user.role === 'admin' ? t('hosting.admin') : t('hosting.already')}</Alert>
          ) : (
            <Button type="button" onClick={start} loading={busy} className="w-full sm:w-auto">
              {t('hosting.cta')}
            </Button>
          )}
        </div>
      </div>
      <div className="aspect-[4/3] overflow-hidden rounded-3xl bg-[#F7F7F7]">
        <img src="/2.jpg" alt="" className="h-full w-full object-cover" />
      </div>
    </div>
  )
}
