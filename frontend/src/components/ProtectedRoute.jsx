import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router'
import { useAuth } from '../context/AuthContext.jsx'
import { safeRedirect } from '../lib/redirect.js'

/**
 * Wrap routes that need a login (and optionally a role):
 *
 *   { element: <ProtectedRoute />, children: [...] }
 *   { element: <ProtectedRoute roles={['host', 'admin']} />, children: [...] }
 */
export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="py-16 text-center text-sm text-[#6A6A6A]">Loading…</div>
  }

  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?redirect=${redirect}`} replace />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return children ?? <Outlet />
}

/**
 * For /login, /register…: logged-in users are sent on.
 * This also does the redirect right after a successful login/register (?redirect=/where/they/were).
 */
export function GuestOnlyRoute() {
  const { user, loading } = useAuth()
  const [params] = useSearchParams()

  if (loading) return null
  if (user) return <Navigate to={safeRedirect(params.get('redirect'))} replace />

  return <Outlet />
}
