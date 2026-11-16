import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import AuthModal from '../components/auth/AuthModal.jsx'

const AuthModalContext = createContext(null)

/**
 * The Airbnb-style "Log in or sign up" dialog, usable from anywhere:
 *
 *   const { openAuthModal } = useAuthModal()
 *   openAuthModal()                                  // start at the email step
 *   openAuthModal({ redirect: '/trips' })            // go there after logging in
 *   openAuthModal({ step: 'forgot' })                // forgot password
 */
export function AuthModalProvider({ children }) {
  const [state, setState] = useState(null)

  // A new key remounts the dialog, so every open starts from a clean form
  const openAuthModal = useCallback((options = {}) => setState({ key: Date.now(), options: { step: 'email', ...options } }), [])
  const closeAuthModal = useCallback(() => setState(null), [])

  const value = useMemo(() => ({ openAuthModal, closeAuthModal }), [openAuthModal, closeAuthModal])

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      {state && <AuthModal key={state.key} {...state.options} onClose={closeAuthModal} />}
    </AuthModalContext.Provider>
  )
}

// eslint-disable-next-line react/only-export-components
export function useAuthModal() {
  const context = useContext(AuthModalContext)
  if (!context) throw new Error('useAuthModal() must be used inside <AuthModalProvider>')
  return context
}
