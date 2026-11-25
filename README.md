# Airbnb Clone

Team project: a Laravel REST API + a React app, each in its own Docker container, sharing one MySQL database.

| Part | Folder | Stack |
|---|---|---|
| Backend (API) | [`backend/`](backend) | PHP 8.4, Laravel 13, Sanctum, MySQL 8.4 |
| Frontend | [`frontend/`](frontend) | React 19 (JavaScript), Vite, Tailwind CSS 4, React Router, axios, react-icons, Leaflet (map) |
| Infrastructure | [`docker/`](docker), [`docker-compose.yml`](docker-compose.yml) | nginx, php-fpm, Node 24, phpMyAdmin, Mailpit |

Database design, ERD and rules: **[docs/database.md](docs/database.md)**.
Login, register, roles and user API (how to protect routes, `useAuth()`): **[docs/api-auth.md](docs/api-auth.md)**.
Homepage search, filters, tabs (homes / hotels / experiences / services) and map: **[docs/api-search.md](docs/api-search.md)**.

## Prerequisites

Only **Docker Desktop** and **Git**. You do *not* need PHP, Composer, Node or MySQL installed locally: everything runs in containers.

**Windows:** use Docker Desktop with the WSL 2 backend. For much faster file access, clone the repo *inside* WSL (e.g. `\\wsl$\Ubuntu\home\<you>\airbnb-clone`) instead of `C:\Users\...`. Both work.

## First run

```bash
git clone <repo-url> airbnb-clone
cd airbnb-clone
docker compose up -d --build --wait
docker compose exec backend php artisan migrate --seed
```

The first `up` takes a few minutes: it builds the PHP image, runs `composer install`, creates `backend/.env` with an app key, and runs `npm install`. `--wait` returns once everything is ready.

Then open **http://localhost:5173**. You should see the homepage with the demo listings, experiences and services. Empty page or an error? Check that the API answers: http://localhost:8000/up shows a green "Application up" page.

## Services

| URL | What |
|---|---|
| http://localhost:5173 | React app (hot reload) |
| http://localhost:8000/api | Laravel API (http://localhost:8000/up = status check) |
| http://localhost:8080 | phpMyAdmin (logged in as root) |
| http://localhost:8025 | Mailpit: every email the app sends lands here |
| `localhost:3307` | MySQL for DBeaver/TablePlus/etc. — db `airbnb_clone`, user `airbnb`, password `secret` |

Ports clash with something on your machine? Copy [`.env.example`](.env.example) to `.env` (repo root) and change them.

## Demo accounts (after seeding)

All passwords are `password`.

| Email | Role | Has |
|---|---|---|
| admin@example.com | admin | — |
| host@example.com | host | 4 published listings + 1 draft, bookings, a guest conversation |
| guest@example.com | guest | past stay with review, upcoming stays, favourites, a conversation |

Plus 2 more hosts and 9 more guests with random data, and for the homepage tabs: 6 hotels, 12 experiences and 10 services (experiences and services can't be booked yet).

Database from before the hotels / experiences / services were added? Add them without losing your data:

```bash
docker compose exec backend php artisan migrate
docker compose exec backend php artisan db:seed --class=HotelExperienceServiceSeeder
```

## Everyday commands

Run these from the repo root.

```bash
docker compose up -d                 # start everything
docker compose down                  # stop (database data is kept)
docker compose logs -f backend       # follow logs (backend | frontend | nginx | mysql)
```

**After every `git pull`** (someone may have added a migration or a package):

```bash
docker compose exec backend php artisan migrate      # new tables / columns
docker compose exec backend composer install         # new PHP packages
docker compose exec frontend npm install             # new JS packages (or: docker compose restart frontend)
```

Backend (anything you'd normally run with `php` / `composer`):

```bash
docker compose exec backend php artisan migrate                      # apply new migrations after git pull
docker compose exec backend php artisan migrate:fresh --seed         # reset the DB to fresh demo data (deletes everything)
docker compose exec backend php artisan db:seed --class=HotelExperienceServiceSeeder  # add only the hotels / experiences / services demo data
docker compose exec backend php artisan make:migration add_x_to_y_table
docker compose exec backend php artisan make:controller Api/PropertyController --api
docker compose exec backend php artisan route:list --path=api
docker compose exec backend php artisan test                         # runs against airbnb_clone_testing, not your dev DB
docker compose exec backend php artisan tinker
docker compose exec backend composer require vendor/package
docker compose exec backend vendor/bin/pint                          # format PHP code
```

Frontend:

```bash
docker compose exec frontend npm install <package>
docker compose exec frontend npm run lint
```

`docker compose restart frontend` also runs `npm install` on start.

## Working as a team

- Branch from `main` (`feature/<short-name>`), open a pull request, get one review, merge.
- **Database changes = new migration.** Never edit a migration that is already on `main`; others have already run it. Add a new one instead.
- Keep `php artisan test` green before opening a PR.
- API routes go in `backend/routes/api.php` (all prefixed with `/api`). The frontend calls them through `frontend/src/lib/api.js`.

## Troubleshooting

| Problem | Fix |
|---|---|
| `port is already allocated` | Something else uses that port (XAMPP, another project). Set a different port in a root `.env` (see `.env.example`). |
| `502 Bad Gateway` on :8000 right after starting | The backend is still running `composer install`. Wait for `docker compose ps` to show it as `healthy`. |
| `/bin/sh^M: not found` / entrypoint errors | The repo was checked out with Windows line endings. Run `git config core.autocrlf input`, then `git rm --cached -r . && git reset --hard`. |
| React changes don't hot reload | Make sure `VITE_USE_POLLING` isn't set to `false` in your root `.env` (Windows/macOS need polling). |
| Vite error `Failed to resolve import "leaflet"` (or `react-icons`, …) after a pull | New package: `docker compose exec frontend npm install` (or `docker compose restart frontend`). |
| API error `Base table or view not found` / `Column not found` after a pull | New migration: `docker compose exec backend php artisan migrate`. |
| Every page takes 1–2 s to load (Windows) | The repo is on `C:\` and Docker reads it through slow Windows file sharing. Clone it inside WSL (see Prerequisites). |
| Tests fail with "Unknown database airbnb_clone_testing" | Your MySQL volume predates the init script. `docker compose down -v` then the first-run steps again (this deletes local DB data). |
| Want a completely clean start | `docker compose down -v` removes the database and `node_modules` volumes. |

## Project layout

```
backend/            Laravel API (app/Models, app/Enums, database/migrations, routes/api.php, tests/)
frontend/           React app (src/pages, src/components, src/lib/api.js)
docker/php/         PHP-FPM image (Dockerfile, php.ini, entrypoint.sh)
docker/nginx/       nginx config for the API
docker/mysql/init/  SQL run once when the DB volume is created (creates the testing DB)
docs/database.md    Database design and rules
docs/api-auth.md    Auth & users API contract
docs/api-search.md  Homepage search, filters, tabs and map
```
