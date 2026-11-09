# Frontend — React + Vite + Tailwind (JavaScript)

Runs in the `frontend` Docker container: http://localhost:5173. See the root [README](../README.md) for setup.

- `src/main.jsx` — router (React Router). Add pages as children of `Layout`.
- `src/pages/` — one component per route.
- `src/components/` — shared UI.
- `src/lib/api.js` — axios client for the Laravel API (`VITE_API_URL` from `.env`). Always use it instead of raw `fetch`.
- Styling: Tailwind CSS 4 (`src/index.css`). Brand colour: `bg-brand` / `text-brand`.

Commands (run from the repo root):

```bash
docker compose exec frontend npm install <package>   # add a dependency
docker compose exec frontend npm run lint            # oxlint
docker compose exec frontend npm run build           # production build
```
