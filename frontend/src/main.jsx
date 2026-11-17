import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Navigate, createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { I18nProvider } from './i18n/I18nContext.jsx'
import Layout from './components/Layout.jsx'
import ProtectedRoute, { GuestOnlyRoute } from './components/ProtectedRoute.jsx'
import Home from './pages/Home.jsx'
import PropertyDetails from './pages/PropertyDetails.jsx'
import NotFound from './pages/NotFound.jsx'
import AuthRoute from './pages/auth/AuthRoute.jsx'
import ResetPassword from './pages/auth/ResetPassword.jsx'
import AccountSettings from './pages/account/AccountSettings.jsx'
import PersonalInfo from './pages/account/PersonalInfo.jsx'
import LoginSecurity from './pages/account/LoginSecurity.jsx'
import Preferences from './pages/account/Preferences.jsx'
import BecomeHost from './pages/account/BecomeHost.jsx'
import PublicProfile from './pages/users/PublicProfile.jsx'
import AdminUsers from './pages/admin/Users.jsx'
import './index.css'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'properties/:id', element: <PropertyDetails /> },
      { path: 'users/:id', element: <PublicProfile /> },
      { path: 'users/show/:id', element: <PublicProfile /> },
      { path: 'become-a-host', element: <BecomeHost /> },

      // Only when logged out. Login/sign up is a dialog over the home page, like Airbnb.
      {
        element: <GuestOnlyRoute />,
        children: [
          { path: 'login', element: <AuthRoute /> },
          { path: 'signup', element: <AuthRoute /> },
          { path: 'register', element: <AuthRoute /> },
          { path: 'forgot-password', element: <AuthRoute step="forgot" /> },
          { path: 'reset-password', element: <ResetPassword /> },
        ],
      },

      // Any logged-in user
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'account-settings', element: <AccountSettings /> },
          { path: 'account-settings/personal-info', element: <PersonalInfo /> },
          { path: 'account-settings/login-and-security', element: <LoginSecurity /> },
          { path: 'account-settings/preferences', element: <Preferences /> },
          { path: 'profile', element: <Navigate to="/account-settings" replace /> },
        ],
      },

      // Admins only
      {
        element: <ProtectedRoute roles={['admin']} />,
        children: [{ path: 'admin/users', element: <AdminUsers /> }],
      },

      { path: '*', element: <NotFound /> },
    ],
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <I18nProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </I18nProvider>
  </StrictMode>,
)
