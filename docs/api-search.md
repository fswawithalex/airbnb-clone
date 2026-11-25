# Homepage: search, filters, tabs and map

API contract for the homepage (search bar, Filters dialog, the All / Homes / Hotels / Experiences / Services tabs, the sliders and the results map), plus where the frontend code lives.

## How it works

- **The URL is the source of truth.** Everything the visitor picks lives in the query string (`/?location=Brasov&check_in=2026-12-08&check_out=2026-12-11&adults=2&types=villa`), so a search survives a reload, can be shared, and Back/Forward work. `frontend/src/lib/search.js` reads the URL (`readSearch`), writes it (`toSearchParams`) and turns it into API params (`toApiParams`).
- **Homepage without a search** (tab "All"): sliders built from the listings ("Destinations for you", "Popular homes in …", "Available in … this weekend", hotels, experiences, services).
- **With a search**: homes / hotels show as a list next to a map; experiences / services as a grid.
- **Homes vs hotels**: both are `properties` (bookable by night); a hotel is `property_type = 'hotel'`. **Experiences and services** are their own tables, priced per guest for one session, and **can't be booked yet** (read-only).
- **Guests**: the search bar has Adults / Children / Infants / Pets. The API gets `guests = adults + children` (infants don't count, like on Airbnb) and `pets`.
- **Recent searches** (under "Where") are kept in the visitor's browser only (`localStorage`, key `recent_searches`, last 5).

## Endpoints

All under `/api`, all public (no token), all `GET`. Invalid query params → `422` (Laravel format: `{ message, errors: { field: [msg] } }`).

| URL | What |
|---|---|
| `/properties` | Published homes + hotels, newest first, filtered by the params below |
| `/destinations` | Cities with published stays, busiest first: `[{ city, country, stays, latitude, longitude }]` (search bar suggestions) |
| `/amenities` | All amenities by name: `[{ id, name, icon }]` (Filters dialog) |
| `/experiences` | Published experiences, newest first. Params: `location`, `guests` |
| `/experiences/{id}` | One experience (drafts → `404`) |
| `/services` | Published services, newest first. Params: `location`, `guests` |
| `/services/{id}` | One service (drafts → `404`) |

### `GET /properties` query params

Every param is optional; they combine (AND).

| Param | Format | Meaning |
|---|---|---|
| `category` | `homes` \| `hotels` | Homes = every type except hotel; hotels = only hotels. Omit for both. |
| `location` | text, max 100 | Matches city, country or title (contains, case-insensitive) |
| `check_in`, `check_out` | `YYYY-MM-DD`, always together | Only listings free for the whole stay (no pending/confirmed booking, no host-blocked dates). `check_in` ≥ today, `check_out` > `check_in` |
| `flexible_days` | `0`, `1`, `2`, `3`, `7`, `14` | With dates: the same number of nights may also start up to N days earlier or later (never in the past) |
| `stay` | `weekend` \| `week` \| `month` | "Flexible" tab instead of dates: a free Friday→Sunday / 7 nights / 28 nights. Not allowed together with `check_in`/`check_out` |
| `months[]` | `YYYY-MM`, max 12 | With `stay`: the stay must start in one of these months. None = the next 6 months |
| `guests` | integer ≥ 1 | `max_guests` ≥ this |
| `pets` | 0–5 | More than 0 = only listings with `pets_allowed` |
| `min_price`, `max_price` | number ≥ 0 | Price per night; `max_price` ≥ `min_price` when both are sent |
| `types[]` | `apartment`, `house`, `villa`, `cabin`, `cottage`, `studio`, `room`, `hotel` | Any of these types |
| `bedrooms` | integer | At least this many bedrooms |
| `amenities[]` | amenity ids | The listing must have **every** one |

Example: `/api/properties?location=Brasov&check_in=2026-12-08&check_out=2026-12-11&flexible_days=2&guests=2&types[]=villa&types[]=cabin&amenities[]=1`

Each listing comes with `primary_image`, `host { id, name }`, `reviews_avg_rating` (`null` without reviews) and `reviews_count` (cards show "★ 4.50 (2)" or "★ New").

## Frontend

| Where | What |
|---|---|
| `src/pages/Home.jsx` | Loads the results for the URL; sliders (no search), list + map (homes/hotels search) or grid |
| `src/components/Layout.jsx` | Header: tabs + full search bar at the top of the homepage; on scroll and on results it shrinks to the compact "Anywhere \| Anytime \| Add guests" pill (+ Filters). Phones (< 640px): "Start your search" pill, chips and the bottom bar |
| `src/components/search/` | `SearchBar` (Where / When / Who), `WherePanel` (recent + suggested), `WhenPanel` + `DateRangeCalendar`, `GuestsPanel`, `FiltersButton` + `FiltersModal`, `CategoryTabs`, `CompactSearch`, `MobileSearch` |
| `src/components/Carousel.jsx` | The sliders with ‹ › arrows |
| `src/components/ResultsMap.jsx` | The map (Leaflet), price pills, mini-card popup |
| `src/lib/search.js` | URL ⇄ search object ⇄ API params, tabs, guests, cached `/destinations` and `/amenities` |
| `src/lib/calendar.js`, `featured.js`, `offerings.js`, `recentSearches.js`, `listing.js` | Dates, homepage rows, experience/service labels, recent searches, card labels |

Texts are in `src/i18n/en.js`, `ro.js`, `ru.js` (`search.*`, `filters.*`, `home.*`, `row.*`, `where.*`, `map.*`, `category.*`).

**Map tiles**: the map uses OpenStreetMap's free tiles (`tile.openstreetmap.org`, no API key, the attribution in the corner is required). That's fine for development; a public site with real traffic must switch to a tile provider (one line, `TILES` in `ResultsMap.jsx`).

## Backend

| Where | What |
|---|---|
| `app/Http/Controllers/Api/PropertyController.php` (`index`) | The `/properties` search |
| `app/Http/Requests/PropertySearchRequest.php` | Validation of the params above |
| `app/Support/FlexibleStay.php` | "Flexible" weekend / week / month search |
| `app/Http/Controllers/Api/DestinationController.php` | `/destinations` |
| `app/Http/Controllers/Api/ExperienceController.php`, `ServiceController.php` | Experiences / services (models share `app/Models/Concerns/IsOffering.php`) |
| `database/seeders/HotelExperienceServiceSeeder.php` | Demo hotels, experiences, services (safe on an existing database) |

Tests: `tests/Feature/Properties/PropertySearchTest.php`, `tests/Feature/Offerings/OfferingApiTest.php`.
