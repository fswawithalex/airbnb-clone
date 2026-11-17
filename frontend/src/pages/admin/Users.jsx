import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useAuth } from '../../context/AuthContext.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'
import api, { errorMessage } from '../../lib/api.js'
import Avatar from '../../components/Avatar.jsx'
import Alert from '../../components/ui/Alert.jsx'

const ROLES = ['guest', 'host', 'admin']

/** /admin/users — search, filter, change roles, delete and restore accounts. */
export default function AdminUsers() {
  const { user: me } = useAuth()
  const { t, formatDate } = useI18n()
  const [params, setParams] = useSearchParams()
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [search, setSearch] = useState(params.get('search') ?? '')

  const query = params.toString()

  const load = useCallback(() => {
    setError(null)
    return api
      .get(`/admin/users${query ? `?${query}` : ''}`)
      .then(({ data }) => setResult(data))
      .catch((err) => setError(errorMessage(err)))
  }, [query])

  useEffect(() => {
    load()
  }, [load])

  // Debounced search box -> ?search=
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((params.get('search') ?? '') !== search) setFilter('search', search)
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  function setFilter(key, value) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next)
  }

  const act = async (user, request) => {
    setBusyId(user.id)
    setError(null)
    try {
      await request()
      await load()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  const changeRole = (user, role) => act(user, () => api.put(`/admin/users/${user.id}/role`, { role }))
  const remove = (user) =>
    window.confirm(t('admin.confirmDelete', { name: user.name })) &&
    act(user, () => api.delete(`/admin/users/${user.id}`))
  const restore = (user) => act(user, () => api.post(`/admin/users/${user.id}/restore`))

  const meta = result?.meta
  const control = 'rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#222222]'

  return (
    <div>
      <h1 className="text-[32px] font-semibold text-[#222222]">{t('admin.title')}</h1>
      <p className="mt-1 text-sm text-[#6A6A6A]">{meta ? t('admin.count', { count: meta.total }) : ' '}</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder={t('admin.search')}
          aria-label={t('admin.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${control} w-full sm:w-72`}
        />
        <select aria-label={t('admin.role')} value={params.get('role') ?? ''} onChange={(e) => setFilter('role', e.target.value)} className={control}>
          <option value="">{t('admin.allRoles')}</option>
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {t(`role.${role}`)}
            </option>
          ))}
        </select>
        <select aria-label={t('admin.deletedOnly')} value={params.get('trashed') ?? ''} onChange={(e) => setFilter('trashed', e.target.value)} className={control}>
          <option value="">{t('admin.activeOnly')}</option>
          <option value="with">{t('admin.withDeleted')}</option>
          <option value="only">{t('admin.deletedOnly')}</option>
        </select>
      </div>

      <div className="mt-4">
        <Alert>{error}</Alert>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-[#6A6A6A]">
            <tr>
              <th className="px-4 py-3 font-semibold">{t('admin.user')}</th>
              <th className="px-4 py-3 font-semibold">{t('admin.role')}</th>
              <th className="px-4 py-3 font-semibold">{t('admin.joined')}</th>
              <th className="px-4 py-3 text-right font-semibold">{t('admin.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!result && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-[#6A6A6A]">
                  {t('common.loading')}
                </td>
              </tr>
            )}
            {result?.data.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-[#6A6A6A]">
                  {t('admin.empty')}
                </td>
              </tr>
            )}
            {result?.data.map((user) => {
              const isMe = user.id === me.id
              const deleted = Boolean(user.deleted_at)
              const busy = busyId === user.id
              return (
                <tr key={user.id} className={deleted ? 'bg-gray-50 text-[#6A6A6A]' : ''}>
                  <td className="px-4 py-3">
                    <Link to={`/users/${user.id}`} className="flex items-center gap-3">
                      <Avatar user={user} />
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-[#222222]">
                          {user.name} {isMe && <span className="text-xs text-[#6A6A6A]">{t('admin.you')}</span>}
                        </span>
                        <span className="block truncate text-xs text-[#6A6A6A]">{user.email}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      aria-label={`${t('admin.role')}: ${user.name}`}
                      value={user.role}
                      disabled={isMe || deleted || busy}
                      onChange={(e) => changeRole(user, e.target.value)}
                      className={`${control} py-1.5 disabled:bg-transparent`}
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {t(`role.${role}`)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(user.created_at, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td className="px-4 py-3 text-right">
                    {deleted ? (
                      <button type="button" disabled={busy} onClick={() => restore(user)} className="font-semibold text-[#222222] underline disabled:opacity-50">
                        {t('admin.restore')}
                      </button>
                    ) : (
                      !isMe && (
                        <button type="button" disabled={busy} onClick={() => remove(user)} className="font-semibold text-red-600 underline disabled:opacity-50">
                          {t('admin.delete')}
                        </button>
                      )
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {meta && meta.last_page > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <button
            type="button"
            disabled={meta.current_page <= 1}
            onClick={() => setFilter('page', String(meta.current_page - 1))}
            className="rounded-lg border border-gray-300 px-4 py-2 font-semibold disabled:opacity-40"
          >
            {t('admin.previous')}
          </button>
          <span className="text-[#6A6A6A]">
            {t('admin.page', { page: meta.current_page, last: meta.last_page })}
          </span>
          <button
            type="button"
            disabled={meta.current_page >= meta.last_page}
            onClick={() => setFilter('page', String(meta.current_page + 1))}
            className="rounded-lg border border-gray-300 px-4 py-2 font-semibold disabled:opacity-40"
          >
            {t('admin.next')}
          </button>
        </div>
      )}
    </div>
  )
}
