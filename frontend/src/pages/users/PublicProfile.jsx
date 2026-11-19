import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useAuth } from '../../context/AuthContext.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'
import api, { errorMessage, validationErrors } from '../../lib/api.js'
import Avatar from '../../components/Avatar.jsx'
import Alert from '../../components/ui/Alert.jsx'

/** Time since joining, as Airbnb shows it: "3 Years on …" or "5 Months on …". */
function tenure(since) {
  const months = Math.max(
    1,
    (new Date().getFullYear() - new Date(since).getFullYear()) * 12 + new Date().getMonth() - new Date(since).getMonth(),
  )
  return months >= 12 ? { value: Math.floor(months / 12), key: 'profile.yearsOn' } : { value: months, key: 'profile.monthsOn' }
}

function Check() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="h-4 w-4 fill-none stroke-[#222222] stroke-[4]">
      <path d="m4 16.5 8 8 16-16" />
    </svg>
  )
}

/** Photo upload on your own profile card ("+ Add" / "Edit" under the avatar, like Airbnb). */
function PhotoControls({ user }) {
  const { setUser } = useAuth()
  const { t } = useI18n()
  const fileRef = useRef(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const send = async (request) => {
    setBusy(true)
    setError(null)
    try {
      const { data } = await request()
      setUser(data.data)
    } catch (err) {
      setError(validationErrors(err).avatar ?? errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const upload = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const body = new FormData()
    body.append('avatar', file)
    send(() => api.post('/user/avatar', body))
  }

  return (
    <div className="mt-3 flex flex-col items-center gap-2">
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={upload} />
      <button
        type="button"
        disabled={busy}
        onClick={() => fileRef.current?.click()}
        className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-[#222222] shadow-[0_2px_8px_rgba(0,0,0,0.18)] disabled:opacity-60"
      >
        <svg viewBox="0 0 32 32" aria-hidden="true" className="h-4 w-4 fill-current">
          <path d="M16 11a6 6 0 1 1 0 12 6 6 0 0 1 0-12zm4.2-8 2.2 4H28a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h5.6l2.2-4zM16 13a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
        </svg>
        {user.avatar_url ? t('common.edit') : t('profile.addPhoto')}
      </button>
      {user.avatar_url && (
        <button type="button" disabled={busy} onClick={() => send(() => api.delete('/user/avatar'))} className="text-xs font-semibold text-[#222222] underline">
          {t('profile.removePhoto')}
        </button>
      )}
      <p className="text-xs text-[#6A6A6A]">{t('profile.photoHint')}</p>
      <Alert>{error}</Alert>
    </div>
  )
}

/** /users/:id — Airbnb-style profile: card with photo + stats on the left, "About" on the right. */
export default function PublicProfile() {
  const { id } = useParams()
  const { user: me } = useAuth()
  const { t, formatDate } = useI18n()
  // Remember which id the answer belongs to, so a new :id shows "Loading…" again
  const [state, setState] = useState({ id: null, profile: null, error: null })

  useEffect(() => {
    api
      .get(`/users/${id}`)
      .then(({ data }) => setState({ id, profile: data.data, error: null }))
      .catch((err) => setState({ id, profile: null, error: err.response?.status === 404 ? t('profile.notFound') : errorMessage(err) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const current = state.id === id
  const loaded = current ? state.profile : null
  const error = current ? state.error : null

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-[#6A6A6A]">{error}</p>
        <Link to="/" className="mt-4 inline-block font-semibold underline">
          {t('common.backHome')}
        </Link>
      </div>
    )
  }

  if (!loaded) return <div className="py-16 text-center text-sm text-[#6A6A6A]">{t('common.loading')}</div>

  const isMe = me?.id === loaded.id
  // Your own avatar may have just changed: show the fresh one from AuthContext
  const profile = isMe ? { ...loaded, avatar_url: me.avatar_url } : loaded
  const time = tenure(profile.member_since)
  const isHost = profile.role === 'host'

  return (
    <div className="mx-auto grid max-w-[1080px] gap-12 md:grid-cols-[342px_minmax(0,1fr)] md:gap-20">
      <div className="space-y-8">
        {isMe && <h1 className="text-[32px] font-semibold text-[#222222] md:hidden">{t('profile.yourProfile')}</h1>}
        {/* Profile card */}
        <div className="grid grid-cols-[1fr_auto] items-center gap-6 rounded-3xl bg-white p-8 shadow-[0_6px_20px_rgba(0,0,0,0.2)]">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <Avatar user={profile} size="xl" />
              {isHost && (
                <span className="absolute bottom-1 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white shadow">
                  <svg viewBox="0 0 32 32" aria-hidden="true" className="h-4 w-4 fill-current">
                    <path d="M16 .8 29 5v9.6c0 7.4-5 13.9-13 16.6C8 28.5 3 22 3 14.6V5z" />
                  </svg>
                </span>
              )}
            </div>
            <h2 className="mt-3 text-[32px] font-bold leading-9 text-[#222222]">{profile.name}</h2>
            <p className="text-sm font-semibold text-[#222222]">{t(`role.${profile.role}`)}</p>
            {isMe && <PhotoControls user={me} />}
          </div>
          <dl className="w-24 divide-y divide-[#DDDDDD] text-[#222222]">
            {isHost && (
              <div className="pb-3">
                <dd className="text-[22px] font-bold leading-6">{profile.listings_count ?? 0}</dd>
                <dt className="text-[10px] font-semibold">{t('profile.listings')}</dt>
              </div>
            )}
            <div className={isHost ? 'py-3' : 'pb-3'}>
              <dd className="text-[22px] font-bold leading-6">{profile.reviews_count ?? 0}</dd>
              <dt className="text-[10px] font-semibold">{t('profile.reviews')}</dt>
            </div>
            <div className="pt-3">
              <dd className="text-[22px] font-bold leading-6">{time.value}</dd>
              <dt className="text-[10px] font-semibold">{t(time.key)}</dt>
            </div>
          </dl>
        </div>

        {/* Confirmed information (only details we actually know are confirmed) */}
        <div className="rounded-3xl border border-[#DDDDDD] p-8">
          <h3 className="text-[22px] font-semibold leading-7 text-[#222222]">{t('profile.confirmed', { name: profile.name })}</h3>
          <ul className="mt-6 space-y-4 text-base text-[#222222]">
            <li className="flex items-center gap-4">
              <Check />
              {t('profile.emailConfirmed')}
            </li>
            {isMe && me.phone && (
              <li className="flex items-center gap-4">
                <Check />
                {t('profile.phoneConfirmed')}
              </li>
            )}
          </ul>
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-[32px] font-semibold leading-9 text-[#222222]">{t('profile.about', { name: profile.name })}</h1>
          {isMe && (
            <Link to="/account-settings/personal-info" className="rounded-lg bg-[#F7F7F7] px-4 py-2 text-sm font-semibold text-[#222222] hover:bg-[#EBEBEB]">
              {t('profile.editProfile')}
            </Link>
          )}
        </div>
        <p className="mt-6 flex items-center gap-3 text-base text-[#222222]">
          <svg viewBox="0 0 32 32" aria-hidden="true" className="h-6 w-6 fill-current">
            <path d="M26 2a5 5 0 0 1 5 4.8V25a5 5 0 0 1-4.8 5H6a5 5 0 0 1-5-4.8V7a5 5 0 0 1 4.8-5H26zm3 10H3v13a3 3 0 0 0 2.8 3H26a3 3 0 0 0 3-2.8V12zM26 4H6a3 3 0 0 0-3 2.8V10h26V7a3 3 0 0 0-2.8-3H26z" />
          </svg>
          {t('profile.joined', { date: formatDate(profile.member_since, { month: 'long', year: 'numeric' }) })}
        </p>
        <div className="mt-10 border-t border-[#DDDDDD]" />
      </div>
    </div>
  )
}
