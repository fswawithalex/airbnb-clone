// "Recent searches" under the search bar's Where box. Kept in this browser only (localStorage), newest first.
const STORAGE_KEY = 'recent_searches'
const MAX = 5

// Same place + same dates = same search, whatever the guests
const searchKey = (s) => [s.location.toLowerCase(), s.check_in, s.check_out, s.stay, (s.months ?? []).join(',')].join('|')
const sameSearch = (a, b) => searchKey(a) === searchKey(b)

export function readRecentSearches() {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(list) ? list.filter((s) => typeof s?.location === 'string' && s.location) : []
  } catch {
    return [] // storage blocked or broken JSON: just no history
  }
}

/** `values` = what the search bar submits (location, dates, guests…). Searches without a place aren't kept. */
export function saveRecentSearch(values) {
  if (!values.location) return
  try {
    const list = [values, ...readRecentSearches().filter((s) => !sameSearch(s, values))].slice(0, MAX)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    // private mode / storage full: nothing to remember
  }
}
