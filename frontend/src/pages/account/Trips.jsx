import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import BookingItem from '../../components/booking/BookingItem.jsx'
import Alert from '../../components/ui/Alert.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'
import api, { errorMessage } from '../../lib/api.js'

const TABS = ['upcoming', 'past', 'cancelled']

/** Guest: my reservations, split into tabs. */
export default function Trips() {
  const { t } = useI18n()
  const [tab, setTab] = useState('upcoming')
  const [page, setPage] = useState(1)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false
    setResult(null)
    setError('')
    api
      .get('/bookings', { params: { scope: tab, page } })
      .then((res) => !ignore && setResult(res.data))
      .catch((err) => !ignore && setError(errorMessage(err)))
    return () => {
      ignore = true
    }
  }, [tab, page])

  const changeTab = (next) => {
    setTab(next)
    setPage(1)
  }

  return (
    <div className="mx-auto max-w-4xl pb-16 text-[#222222]">
      <h1 className="text-[32px] font-semibold">{t('trips.title')}</h1>

      <div role="tablist" className="mt-6 flex gap-6 border-b border-[#EBEBEB]">
        {TABS.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={tab === name}
            onClick={() => changeTab(name)}
            className={`-mb-px border-b-2 pb-3 text-sm font-semibold transition ${
              tab === name ? 'border-[#222222] text-[#222222]' : 'border-transparent text-[#6A6A6A] hover:text-[#222222]'
            }`}
          >
            {t(`trips.tab_${name}`)}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {error && <Alert>{error}</Alert>}
        {!error && !result && <p className="py-10 text-center text-sm text-[#6A6A6A]">{t('common.loading')}</p>}

        {result?.data.length === 0 && (
          <div className="rounded-2xl border border-[#EBEBEB] p-8">
            <p className="text-lg font-semibold">{t(`trips.empty_${tab}`)}</p>
            <p className="mt-1 text-sm text-[#6A6A6A]">{t('trips.emptyText')}</p>
            <Link to="/" className="mt-5 inline-block rounded-lg bg-[#222222] px-5 py-3 text-sm font-semibold text-white hover:bg-black">
              {t('trips.startSearching')}
            </Link>
          </div>
        )}

        {result?.data.length > 0 && (
          <div className="space-y-4">
            {result.data.map((booking) => (
              <BookingItem key={booking.id} booking={booking} />
            ))}
          </div>
        )}

        {result?.last_page > 1 && (
          <div className="mt-6 flex items-center justify-center gap-4 text-sm">
            <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border px-4 py-2 font-semibold disabled:opacity-40">
              {t('admin.previous')}
            </button>
            <span>{t('admin.page', { page: result.current_page, last: result.last_page })}</span>
            <button type="button" disabled={page >= result.last_page} onClick={() => setPage(page + 1)} className="rounded-lg border px-4 py-2 font-semibold disabled:opacity-40">
              {t('admin.next')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
