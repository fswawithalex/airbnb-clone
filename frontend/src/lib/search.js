// Homepage search + filters. The URL is the source of truth (/?location=Brasov&adults=2&types=villa&types=cabin),
// so results survive a reload, can be shared, and Back/Forward work. Keys match GET /api/properties params.
import api from './api.js'
import { countLabel } from './listing.js'

export const PROPERTY_TYPES = ['apartment', 'house', 'villa', 'cabin', 'cottage', 'studio', 'room', 'hotel']

/**
 * Tabs in the header (?category=…, none = All). Homes/Hotels are properties (GET /api/properties?category=),
 * Experiences/Services have their own endpoints. All shows properties plus a row of each.
 */
export const CATEGORIES = [
  { id: 'all', icon: '🌍' },
  { id: 'homes', icon: '🏠' },
  { id: 'hotels', icon: '🏨' },
  { id: 'experiences', icon: '🎈' },
  { id: 'services', icon: '🛎️' },
]
export const OFFERING_CATEGORIES = ['experiences', 'services']

/** Bedroom choices in the filters dialog: '' = any, otherwise "at least N". */
export const BEDROOM_OPTIONS = ['', '1', '2', '3', '4', '5']

/** "± N days" chips under the calendar (0 = exact dates). */
export const FLEXIBLE_DAYS = [0, 1, 2, 3, 7, 14]

/** "Flexible" tab: stay length, and how many months (from the current one) can be picked. */
export const STAY_LENGTHS = ['weekend', 'week', 'month']
export const FLEXIBLE_MONTHS = 6

/** "Who" counters, with Airbnb's limits. Adults + children = guests; infants don't count; pets need pets_allowed. */
export const GUEST_LIMITS = { adults: 16, children: 15, infants: 5, pets: 5 }
export const MAX_GUESTS = 16

// adults/children/infants only live in the URL (to refill the counters); the API gets guests = adults + children
const GUEST_KEYS = ['adults', 'children', 'infants', 'pets']
const UI_ONLY_KEYS = ['adults', 'children', 'infants']

const SINGLE_KEYS = ['category', 'location', 'check_in', 'check_out', 'flexible_days', 'stay', ...GUEST_KEYS, 'min_price', 'max_price', 'bedrooms']
const LIST_KEYS = ['months', 'types', 'amenities']

export const EMPTY_SEARCH = {
  category: '',
  location: '',
  check_in: '',
  check_out: '',
  flexible_days: '',
  stay: '',
  months: [],
  adults: '',
  children: '',
  infants: '',
  pets: '',
  min_price: '',
  max_price: '',
  bedrooms: '',
  types: [],
  amenities: [],
}

/** URLSearchParams -> search object (unknown keys ignored, every value a string or a string array). */
export function readSearch(params) {
  const search = { ...EMPTY_SEARCH }
  for (const key of SINGLE_KEYS) search[key] = params.get(key)?.trim() ?? ''
  for (const key of LIST_KEYS) search[key] = params.getAll(key).filter(Boolean)
  // Links from before the Adults/Children split had ?guests=N
  if (!search.adults && !search.children) search.adults = params.get('guests')?.trim() ?? ''
  return search
}

/** Search object -> URLSearchParams, leaving out empty values so the URL stays short. */
export function toSearchParams(search) {
  const params = new URLSearchParams()
  for (const key of SINGLE_KEYS) {
    const value = String(search[key] ?? '').trim()
    if (value) params.set(key, value)
  }
  for (const key of LIST_KEYS) for (const value of search[key] ?? []) params.append(key, value)
  return params
}

/** Search object -> axios params (axios sends arrays as types[]=a&types[]=b, which Laravel reads as arrays). */
export function toApiParams(search) {
  const guests = totalGuests(search)
  // Only Homes/Hotels narrow the properties; on All every property shows
  const category = ['homes', 'hotels'].includes(search.category) ? search.category : ''
  return Object.fromEntries(
    Object.entries({ ...search, category, guests: guests > 0 ? String(guests) : '' }).filter(
      ([key, value]) => !UI_ONLY_KEYS.includes(key) && (Array.isArray(value) ? value.length > 0 : value !== '' && value !== '0'),
    ),
  )
}

/** Params for GET /api/experiences and /api/services: they only understand "where" and "who". */
export function toOfferingApiParams(search) {
  const guests = totalGuests(search)
  return { ...(search.location && { location: search.location }), ...(guests > 0 && { guests }) }
}

const totalGuests = (search) => (Number(search.adults) || 0) + (Number(search.children) || 0)

/** Something narrows the results (a tab other than All, the search bar or a filter). */
export function hasSearch(search) {
  return Boolean(search.category) || Object.keys(toApiParams(search)).length > 0
}

/** The search bar's own fields, to remount it when they change in the URL (Back/Forward, reset). */
export function searchBarKey(search) {
  return [
    search.location, search.check_in, search.check_out, search.flexible_days, search.stay, search.months.join(','),
    search.adults, search.children, search.infants, search.pets,
  ].join('|')
}

/** Number shown on the Filters button: one per price range, bedroom choice, type and amenity. */
export function countFilters(search) {
  return (
    (search.min_price || search.max_price ? 1 : 0) +
    (search.bedrooms ? 1 : 0) +
    search.types.length +
    search.amenities.length
  )
}

/** Only the filters-dialog part cleared, the search bar (where / when / who) kept. */
export function clearFilters(search) {
  return { ...search, min_price: '', max_price: '', bedrooms: '', types: [], amenities: [] }
}

/** URL search object -> { adults, children, infants, pets } as numbers. */
export function guestsFromSearch(search) {
  return {
    adults: Number(search.adults) || 0,
    children: Number(search.children) || 0,
    infants: Number(search.infants) || 0,
    pets: Number(search.pets) || 0,
  }
}

/** "3 guests, 1 infant, 1 pet" for the bar's Who box ('' when nobody was added). Counts are numbers. */
export function guestsLabel({ adults, children, infants, pets }, t, locale) {
  return [
    adults + children > 0 && countLabel(t, locale, 'listing.guests', adults + children),
    infants > 0 && countLabel(t, locale, 'search.infantsCount', infants),
    pets > 0 && countLabel(t, locale, 'search.petsCount', pets),
  ]
    .filter(Boolean)
    .join(', ')
}

// Cities with stays ("Suggested destinations" under Where): once per page load, like the amenities below.
let destinationsRequest = null
export function loadDestinations() {
  destinationsRequest ??= api.get('/destinations').then((response) => response.data)
  destinationsRequest.catch(() => {
    destinationsRequest = null
  })
  return destinationsRequest
}

// Amenities rarely change: load them once per page load, not every time the dialog opens.
let amenitiesRequest = null
export function loadAmenities() {
  amenitiesRequest ??= api.get('/amenities').then((response) => response.data)
  amenitiesRequest.catch(() => {
    amenitiesRequest = null // let the next open retry
  })
  return amenitiesRequest
}
