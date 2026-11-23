import { useCallback, useEffect, useState } from 'react'
import ReservationCard from '../../components/host/ReservationCard.jsx'
import Alert from '../../components/ui/Alert.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'
import api, { errorMessage } from '../../lib/api.js'

const TABS = ['pending', 'upcoming', 'past', 'cancelled', 'all']

/** Host: incoming requests & reservations on my listings. */
export default function HostReservations() {
  const { t } = useI18n()
  const [tab, setTab] = useState('pending')
  const [page, setPage] = useState(1)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const load = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    let ignore = false
    setResult(null)
    setError('')
    api
      .get('/host/reservations', { params: { scope: tab, page } })
      .then((res) => !ignore && setResult(res.data))
      .catch((err) => !ignore && setError(errorMessage(err)))
    return () => {
      ignore = true
    }
  }, [tab, page, reloadKey])

  const changeTab = (next) => {
    setTab(next)
    setPage(1)
    setActionError('')
    setNotice('')
  }

  const handleUpdated = (_booking, message) => {
    setActionError('')
    setNotice(message)
    load()
  }

  const pendingCount = result?.pending_count ?? 0

  return (
    <div className="mx-auto max-w-4xl pb-16 text-[#222222]">
      <h1 className="text-[32px] font-semibold">{t('host.reservationsTitle')}</h1>
      <p className="mt-1 text-sm text-[#6A6A6A]">{t('host.reservationsSubtitle')}</p>

      <div role="tablist" className="mt-6 flex flex-wrap gap-6 border-b border-[#EBEBEB]">
        {TABS.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={tab === name}
            onClick={() => changeTab(name)}
            className={`-mb-px inline-flex items-center gap-2 border-b-2 pb-3 text-sm font-semibold transition ${
              tab === name ? 'border-[#222222] text-[#222222]' : 'border-transparent text-[#6A6A6A] hover:text-[#222222]'
            }`}
          >
            <span>{t(`host.tab_${name}`)}</span>
            {name === 'pending' && pendingCount > 0 && (
              <span className="rounded-full bg-[#FF385C] px-2 py-0.5 text-xs font-semibold text-white">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {notice && <Alert type="success">{notice}</Alert>}
        {actionError && <Alert>{actionError}</Alert>}
        {error && <Alert>{error}</Alert>}

        {!error && !result && <p className="py-10 text-center text-sm text-[#6A6A6A]">{t('common.loading')}</p>}

        {result?.data.length === 0 && (
          <div className="rounded-2xl border border-[#EBEBEB] p-8">
            <p className="text-lg font-semibold">{t(`host.empty_${tab}`)}</p>
            <p className="mt-1 text-sm text-[#6A6A6A]">{t('host.emptyText')}</p>
          </div>
        )}

        {result?.data.length > 0 && (
          <div className="space-y-4">
            {result.data.map((booking) => (
              <ReservationCard
                key={booking.id}
                booking={booking}
                onUpdated={handleUpdated}
                onError={setActionError}
              />
            ))}
          </div>
        )}

        {result?.last_page > 1 && (
          <div className="mt-6 flex items-center justify-center gap-4 text-sm">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="rounded-lg border px-4 py-2 font-semibold disabled:opacity-40"
            >
              {t('admin.previous')}
            </button>
            <span>{t('admin.page', { page: result.current_page, last: result.last_page })}</span>
            <button
              type="button"
              disabled={page >= result.last_page}
              onClick={() => setPage(page + 1)}
              className="rounded-lg border px-4 py-2 font-semibold disabled:opacity-40"
            >
              {t('admin.next')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
