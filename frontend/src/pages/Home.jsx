import { useEffect, useState } from 'react'
import api from '../lib/api.js'

// Placeholder start page: proves the React app can reach the Laravel API and MySQL.
// Replace with the real listings page.
export default function Home() {
  const [health, setHealth] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api
      .get('/health')
      .then((response) => setHealth(response.data))
      .catch((err) => setError(err.response?.data ?? { message: err.message }))
  }, [])

  return (
    <section className="max-w-xl">
      <h1 className="text-3xl font-semibold">Development environment</h1>
      <p className="mt-2 text-gray-600">React + Vite + Tailwind, talking to the Laravel API.</p>

      <dl className="mt-8 divide-y divide-gray-200 rounded-xl border border-gray-200">
        <StatusRow label="API" value={error ? 'unreachable' : health ? health.status : 'checking…'} ok={!error && health?.status === 'ok'} />
        <StatusRow label="Database" value={error ? (error.database ?? 'unknown') : health ? health.database : 'checking…'} ok={!error && health?.database === 'connected'} />
        <StatusRow label="API URL" value={api.defaults.baseURL} />
      </dl>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          Could not reach the API. Is <code>docker compose up</code> running? ({error.message ?? error.status})
        </p>
      )}
    </section>
  )
}

function StatusRow({ label, value, ok }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <dt className="text-gray-600">{label}</dt>
      <dd className="flex items-center gap-2 font-medium">
        {ok !== undefined && <span className={`h-2.5 w-2.5 rounded-full ${ok ? 'bg-green-500' : 'bg-gray-300'}`} />}
        {value}
      </dd>
    </div>
  )
}
