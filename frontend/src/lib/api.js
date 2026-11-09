import axios from 'axios'

// Shared HTTP client for the Laravel API. Import it everywhere instead of calling fetch/axios directly,
// so auth headers/cookies and error handling can be added in one place later.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api',
  headers: {
    Accept: 'application/json',
  },
})

export default api
