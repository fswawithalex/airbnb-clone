import { useSearchParams } from 'react-router'
import { readSearch, searchBarKey, toSearchParams } from '../../lib/search.js'
import SearchBar from './SearchBar.jsx'

/**
 * The search bar in the homepage header, reading from and writing to the URL that Home.jsx loads results from.
 * `onDone` runs after a search (the phone sheet closes itself with it).
 */
export default function HeaderSearch({ onDone }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const search = readSearch(searchParams)

  return (
    <SearchBar
      key={searchBarKey(search)}
      initial={search}
      onSearch={(values) => {
        setSearchParams(toSearchParams({ ...search, ...values }))
        onDone?.()
      }}
    />
  )
}
