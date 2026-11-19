# Module 1: authentication & users

API contract for login, register, profiles, roles and admin user management, plus how other modules use it.

## How auth works

- **Bearer tokens** (Sanctum personal access tokens). Login/register return a `token`; send it as `Authorization: Bearer <token>`.
- The React app does this for you: `frontend/src/lib/api.js` stores the token in `localStorage` (`auth_token`) and adds the header to every request. **Always call the API through `api`**, never plain `fetch`/`axios`.
- Any `401` from the API clears the token and logs the user out in the UI.
- Sign up works like Airbnb: one dialog, **email first** (`POST /auth/check-email`), then either the password (existing account) or "Finish signing up" (legal first/last name, birth date 18+, password).
- Everybody registers as **guest**. `POST /api/user/become-host` switches to **host**. Only an admin can make admins. `role` can never be sent in a register/profile request (it is not fillable).
- No email verification. Email is used for password reset only (lands in Mailpit, http://localhost:8025).
- **Languages: en / ro / ru.** The React app sends `Accept-Language` with every request, so validation messages, API messages and the reset email come back in that language (`backend/lang/ro`, `backend/lang/ru`, `ro.json`, `ru.json`). Anything not translated falls back to English.

## Endpoints

All under `/api`. `🔒` = needs a token. Errors: `401` no/invalid token, `403` wrong role, `422` validation (Laravel format: `{ message, errors: { field: [msg] } }`).

### Auth

| Method | URL | Body | Response |
|---|---|---|---|
| POST | `/auth/check-email` | `email` | `{ exists: true \| false }` (max 20/min) |
| POST | `/auth/register` | `first_name, last_name, birth_date (YYYY-MM-DD, 18+), email, password, phone?` | `201 { user, token }` |
| POST | `/auth/login` | `email, password, device_name?` | `200 { user, token }`, wrong credentials → `422` on `email` |
| POST | `/auth/logout` 🔒 | – | `200`, revokes only this token |
| POST | `/auth/forgot-password` | `email` | always `200` with the same message (doesn't reveal if the email exists) |
| POST | `/auth/reset-password` | `token, email, password, password_confirmation` | `200`; logs out all devices. Bad/expired token → `422` on `email` |

Register, login and forgot-password: max 6 requests per minute per IP (`429` after). Passwords: min 8 characters, letters and numbers. Emails are stored lowercase.

The reset email links to `FRONTEND_URL/reset-password?token=…&email=…` (React page).

### Own account 🔒

| Method | URL | Body | Response |
|---|---|---|---|
| GET | `/user` | – | `{ data: User }` |
| PUT | `/user/profile` | any of `first_name, last_name, email, phone` | `{ data: User }` |
| POST | `/user/avatar` | multipart `avatar` (jpg/png/webp, ≤ 2 MB) | `{ data: User }`, old file deleted |
| DELETE | `/user/avatar` | – | `{ data: User }` |
| PUT | `/user/password` | `current_password, password, password_confirmation` | `200`; other devices logged out |
| POST | `/user/become-host` | – | `{ data: User }` with `role: "host"` (admins → `422`) |
| DELETE | `/user` | `password` | `200`; soft delete, all tokens revoked |

### Public

| Method | URL | Response |
|---|---|---|
| GET | `/users/{id}` | `{ data: PublicUser }`; deleted users → `404` |

### Admin 🔒 `role:admin`

| Method | URL | Body / query | Response |
|---|---|---|---|
| GET | `/admin/users` | `?search=&role=guest\|host\|admin&trashed=with\|only&page=&per_page=` (default 20, max 100) | paginated `{ data: User[], links, meta }` |
| GET | `/admin/users/{id}` | – | `{ data: User }` (works for deleted users) |
| PUT | `/admin/users/{id}/role` | `role` | `{ data: User }`; not on yourself or on deleted users (`422`) |
| DELETE | `/admin/users/{id}` | – | `200`; soft delete + revoke tokens; not yourself (`422`) |
| POST | `/admin/users/{id}/restore` | – | `{ data: User }` |

### Shapes

```jsonc
// User (yourself, admins)
{ "id": 1, "name": "Ana Pop", "first_name": "Ana", "last_name": "Pop", "birth_date": "1995-04-12",
  "email": "ana@example.com", "phone": "+40700000000",
  "avatar_url": "http://localhost:8000/storage/avatars/1/x.jpg", "role": "guest",
  "created_at": "2026-11-16T10:00:00.000000Z",
  "deleted_at": null } // only present for admins

// PublicUser (first name only, like Airbnb)
{ "id": 1, "name": "Ana", "avatar_url": null, "role": "host",
  "member_since": "2026-11-16T10:00:00.000000Z", "listings_count": 4, "reviews_count": 2 }
```

`avatar_url` is also appended to every `User` model you serialize (e.g. `host:id,name,avatar` on a property).

## Using it in other modules

### Backend

```php
// Any logged-in user
Route::middleware('auth:sanctum')->group(...);

// Only hosts (and admins)
Route::middleware(['auth:sanctum', 'role:host,admin'])->group(...);

// In a controller
$request->user();          // App\Models\User
$request->user()->isHost();
$request->user()->isAdmin();
```

Tests: `Sanctum::actingAs(User::factory()->host()->create());`. If the code calls `currentAccessToken()->delete()`, use a real token instead: `$this->withToken($user->createToken('test')->plainTextToken)`.

### Frontend

```jsx
import { useAuth } from '../context/AuthContext.jsx'

const { user, loading, isAuthenticated, isHost, isAdmin, login, logout, becomeHost, refreshUser } = useAuth()
```

Protect routes in `main.jsx`:

```jsx
{ element: <ProtectedRoute />, children: [{ path: 'trips', element: <Trips /> }] }                      // logged in
{ element: <ProtectedRoute roles={['host', 'admin']} />, children: [{ path: 'host', element: <HostDashboard /> }] } // hosts
```

Logged-out users get the login dialog (`/login?redirect=<where they were>`) and come back after logging in.
Open the dialog yourself, e.g. on a "Reserve" button: `const { openAuthModal } = useAuthModal(); openAuthModal({ redirect: '/trips' })` (from `context/AuthModalContext.jsx`).

Form helpers in `lib/api.js`: `validationErrors(error)` → `{ field: 'message' }`, `errorMessage(error)` → one string.
Airbnb-style UI pieces you can reuse: `components/ui/FloatingInput.jsx` (input with floating label + error, `FieldGroup` for joined boxes), `Button.jsx` (`primary` = pink gradient, `dark`, `outline`, `danger`), `Modal.jsx`, `Alert.jsx`, `components/Avatar.jsx`.

## Pages

| URL | Who | What |
|---|---|---|
| `/login`, `/signup`, `/forgot-password` | logged out | open the "Log in or sign up" dialog over the home page |
| `/reset-password?token=…&email=…` | logged out | link from the reset email |
| `/account-settings` | logged in | card grid: Personal info, Login & security, Global preferences, Hosting, (Manage users) |
| `/account-settings/personal-info` | logged in | legal name, email, phone (edit one row at a time) |
| `/account-settings/login-and-security` | logged in | change password, deactivate account |
| `/account-settings/preferences` | logged in | preferred language |
| `/users/:id` | everyone | Airbnb-style profile; on your own you can add/change the photo |
| `/become-a-host` | everyone | guest → host (role change only; listings/dashboard are module 2) |
| `/admin/users` | admins | user management |

The user menu also links to `/wishlists`, `/trips` and `/messages`: those pages belong to the other modules.

Demo logins (after `migrate --seed`, password `password`): `admin@example.com`, `host@example.com`, `guest@example.com`.

## Translations (frontend)

```jsx
import { useI18n } from '../i18n/I18nContext.jsx'

const { t, locale, setLocale, formatDate } = useI18n()
t('menu.logout')                         // "Log out" / "Deconectează-te" / "Выйти"
t('admin.count', { count: 12 })          // "{count} accounts" with the value filled in
formatDate(user.created_at)              // date in the current language
```

Strings live in `frontend/src/i18n/en.js`, `ro.js` and `ru.js` (same keys in all three). The globe button in the header (next to the user menu) and Account › Global preferences switch the language; the choice is saved in the browser.
