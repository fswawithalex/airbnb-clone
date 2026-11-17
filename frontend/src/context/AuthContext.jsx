import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api, { getToken, setToken } from '../lib/api.js'

const AuthContext = createContext(null)

/**
 * Holds the logged-in user for the whole app.
 *
 *   const { user, loading, login, logout } = useAuth()
 *   user?.role === 'host'
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // true until we know whether a stored token is still valid
  const [loading, setLoading] = useState(() => Boolean(getToken()))

  const refreshUser = useCallback(async () => {
    if (!getToken()) {
      setUser(null)
      return null
    }
    try {
      const { data } = await api.get('/user')
      setUser(data.data)
      return data.data
    } catch {
      setUser(null)
      return null
    }
  }, [])

  useEffect(() => {
    // Stored token from a previous visit: check it is still valid
    if (getToken()) {
      api
        .get('/user')
        .then(({ data }) => setUser(data.data))
        .catch(() => setUser(null))
        .finally(() => setLoading(false))
    }

    // api.js fires this when the server answers 401
    const onLogout = () => setUser(null)
    window.addEventListener('auth:logout', onLogout)
    return () => window.removeEventListener('auth:logout', onLogout)
  }, [])

  const startSession = useCallback(({ user, token }) => {
    setToken(token)
    setUser(user)
    return user
  }, [])

  const login = useCallback(
    async (email, password) => startSession((await api.post('/auth/login', { email, password })).data),
    [startSession],
  )

  const register = useCallback(
    async (fields) => startSession((await api.post('/auth/register', fields)).data),
    [startSession],
  )

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // token already invalid: nothing to revoke
    }
    setToken(null)
    setUser(null)
  }, [])

  /** Clears the session locally after the account was deleted. */
  const forget = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  const becomeHost = useCallback(async () => {
    const { data } = await api.post('/user/become-host')
    setUser(data.data)
    return data.data
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isHost: user?.role === 'host' || user?.role === 'admin',
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      forget,
      becomeHost,
      refreshUser,
      setUser,
    }),
    [user, loading, login, register, logout, forget, becomeHost, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth() must be used inside <AuthProvider>')
  return context
}
