import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Link, useSearchParams } from 'react-router';
import api, { errorMessage } from '../lib/api.js';
import { nightsBetween } from '../lib/booking.js';
import { citiesByCount, cityStyle, upcomingWeekend } from '../lib/featured.js';
import { countLabel } from '../lib/listing.js';
import {
  EMPTY_SEARCH,
  OFFERING_CATEGORIES,
  hasSearch,
  readSearch,
  toApiParams,
  toOfferingApiParams,
  toSearchParams,
} from '../lib/search.js';
import { useI18n } from '../i18n/I18nContext.jsx';
import Carousel from '../components/Carousel.jsx';
import PropertyCard from '../components/PropertyCard.jsx';
import OfferingCard from '../components/OfferingCard.jsx';
import ResultsMap from '../components/ResultsMap.jsx';
import FiltersButton from '../components/search/FiltersButton.jsx';

// Same density as the sliders: 12px between cards, 7 per row from 1280px
const GRID = 'grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7';

const POPULAR_HEADINGS = {
  '': 'home.popularStays', // homes + hotels
  homes: 'home.popular',
  hotels: 'home.popularHotels',
  experiences: 'home.popularExperiences',
  services: 'home.popularServices',
};

/** Link to the homepage with only these search keys set. */
const homeLink = (params) => ({ pathname: '/', search: toSearchParams({ ...EMPTY_SEARCH, ...params }).toString() });

export default function Home() {
  const { t, locale } = useI18n();
  // Tab, search and filters live in the URL (/?category=hotels&location=Brasov), see lib/search.js.
  // The tabs and the search bar are in the header (components/Layout.jsx) and change the same URL.
  const [searchParams, setSearchParams] = useSearchParams();
  const queryKey = searchParams.toString();
  const search = useMemo(() => readSearch(new URLSearchParams(queryKey)), [queryKey]);

  const category = OFFERING_CATEGORIES.includes(search.category) || ['homes', 'hotels'].includes(search.category) ? search.category : '';
  const offeringTab = OFFERING_CATEGORIES.includes(category) ? category : null; // 'experiences' | 'services' | null
  const searching = hasSearch({ ...search, category: '' }); // where / when / who / filters
  // "All" before any search: rows of sliders ("Destinations for you", "Popular homes in …"). Otherwise a grid.
  const featured = category === '' && !searching;
  const showOfferingRows = category === '';
  const weekend = useMemo(() => upcomingWeekend(), []);

  // Last finished request. `key` says which URL it answers: when it differs, a newer one is loading
  // (the old cards stay on screen, dimmed, until it arrives).
  const [result, setResult] = useState({ key: null, properties: [], weekendStays: [], experiences: [], services: [], error: null });
  // Results with a map: the listing under the mouse (highlighted on the map), and the list/map switch below 1024px
  const [hoveredId, setHoveredId] = useState(null);
  const [mapOnly, setMapOnly] = useState(false);
  const wide = useIsWide();

  useEffect(() => {
    // Abort the previous requests so a slow old search can't overwrite newer results
    const controller = new AbortController();
    const get = (url, params) => api.get(url, { params, signal: controller.signal }).then((response) => response.data);
    const offeringParams = toOfferingApiParams(search);

    Promise.all([
      offeringTab ? [] : get('/properties', toApiParams(search)),
      featured ? get('/properties', { check_in: weekend.check_in, check_out: weekend.check_out }) : [],
      offeringTab === 'experiences' || showOfferingRows ? get('/experiences', offeringParams) : [],
      offeringTab === 'services' || showOfferingRows ? get('/services', offeringParams) : [],
    ])
      .then(([properties, weekendStays, experiences, services]) =>
        setResult({ key: queryKey, properties, weekendStays, experiences, services, error: null }),
      )
      .catch(
        (err) =>
          err.code !== 'ERR_CANCELED' && setResult((previous) => ({ ...previous, key: queryKey, error: errorMessage(err) })),
      );
    return () => controller.abort();
  }, [search, queryKey, offeringTab, showOfferingRows, featured, weekend]);

  const loading = result.key !== queryKey;
  const error = loading ? null : result.error;

  // "Clear search" keeps the tab you are on
  const resetSearch = () => setSearchParams(toSearchParams({ ...EMPTY_SEARCH, category }));
  // Price / type / bedrooms / amenities only exist for homes and hotels
  const filters = offeringTab ? null : <FiltersButton />;

  if (error) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700">
        <span>
          {t('home.error')} {error}
        </span>
        {searching && (
          <button type="button" onClick={resetSearch} className="font-semibold underline">
            {t('home.clearSearch')}
          </button>
        )}
      </div>
    );
  }

  if (loading && result.key === null) {
    return <div className="py-16 text-center text-sm text-[#6A6A6A]">{t('home.loading')}</div>;
  }

  if (featured) {
    return (
      <div className={`transition-opacity ${loading ? 'opacity-50' : ''}`}>
        <FeaturedRows result={result} weekend={weekend} filters={filters} />
      </div>
    );
  }

  // Search results / a tab: one grid. Searching homes / hotels: a list of bigger cards next to a map, like Airbnb.
  const items = offeringTab ? result[offeringTab] : result.properties;
  const nights = search.check_in && search.check_out ? nightsBetween(search.check_in, search.check_out) : 0;
  const withMap = searching && !offeringTab;
  // Narrow screens: the list or the map, switched with the floating button
  const showList = !withMap || wide || !mapOnly;
  const showMap = withMap && (wide || mapOnly);

  let heading;
  if (loading) heading = t('common.loading');
  else if (withMap && search.location) heading = countLabel(t, locale, 'home.staysIn', items.length, { place: search.location });
  else if (searching) heading = t(offeringTab ? `home.found_${offeringTab}` : 'home.results', { count: items.length });
  else heading = t(POPULAR_HEADINGS[category]);

  if (withMap) {
    return (
      <section className="lg:flex lg:items-start lg:gap-6">
        {showList && (
          <div className="min-w-0 lg:w-[56%]">
            <ResultsHeading heading={heading} searching onClear={resetSearch}>
              {/* From 768px the header shows Filters next to the compact search pill */}
              <div className="md:hidden">{filters}</div>
            </ResultsHeading>

            {!loading && items.length === 0 ? (
              <NoResults onClear={resetSearch} />
            ) : (
              <div aria-busy={loading} className={`grid gap-x-6 gap-y-10 transition-opacity sm:grid-cols-2 ${loading ? 'opacity-50' : ''}`}>
                {items.map((property) => (
                  <div key={property.id} onMouseEnter={() => setHoveredId(property.id)} onMouseLeave={() => setHoveredId(null)}>
                    <PropertyCard property={property} nights={nights} variant="detailed" />
                  </div>
                ))}
              </div>
            )}

            {showOfferingRows && (
              <div className={`mt-12 transition-opacity ${loading ? 'opacity-50' : ''}`}>
                <OfferingCarousel kind="experiences" items={result.experiences} search={search} />
                <OfferingCarousel kind="services" items={result.services} search={search} />
              </div>
            )}
          </div>
        )}

        {showMap && (
          // Stays in view while the list scrolls (below the 81px fixed header)
          <div className="h-[calc(100dvh-11rem)] min-h-[420px] lg:sticky lg:top-24 lg:h-[calc(100dvh-8rem)] lg:flex-1">
            <ResultsMap properties={items} nights={nights} hoveredId={hoveredId} />
          </div>
        )}

        {!wide && (
          <button
            type="button"
            onClick={() => setMapOnly((value) => !value)}
            className="fixed bottom-24 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#222222] px-5 py-3 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(0,0,0,0.25)] transition active:scale-95 sm:bottom-8"
          >
            {mapOnly ? t('map.showList') : t('map.show')}
            <span aria-hidden="true">{mapOnly ? '☰' : '🗺️'}</span>
          </button>
        )}
      </section>
    );
  }

  return (
    <section>
      <ResultsHeading heading={heading} searching={searching} onClear={resetSearch}>
        {filters}
      </ResultsHeading>

      {!loading && items.length === 0 ? (
        <NoResults onClear={searching ? resetSearch : null} />
      ) : (
        // Плотность сетки 1-в-1 как на новом Airbnb (до 7 карточек в ряд)
        <div aria-busy={loading} className={`${GRID} transition-opacity ${loading ? 'opacity-50' : ''}`}>
          {offeringTab
            ? items.map((offering) => <OfferingCard key={offering.id} offering={offering} kind={offeringTab} />)
            : items.map((property) => <PropertyCard key={property.id} property={property} nights={nights} />)}
        </div>
      )}

      {showOfferingRows && (
        <div className={`mt-12 transition-opacity ${loading ? 'opacity-50' : ''}`}>
          <OfferingCarousel kind="experiences" items={result.experiences} search={search} />
          <OfferingCarousel kind="services" items={result.services} search={search} />
        </div>
      )}
    </section>
  );
}

/** "12 stays in Paris" + "Clear search" + extra buttons (Filters) above the results. */
function ResultsHeading({ heading, searching, onClear, children }) {
  const { t } = useI18n();
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-lg font-semibold text-[#222222] sm:text-xl" aria-live="polite">
        {heading}
      </h2>
      <div className="flex items-center gap-4">
        {searching && (
          <button type="button" onClick={onClear} className="text-sm font-semibold text-[#222222] underline">
            {t('home.clearSearch')}
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

/** Empty results; `onClear` (when searching) adds a "Clear search" button. */
function NoResults({ onClear }) {
  const { t } = useI18n();
  return (
    <div className="py-16 text-center">
      <h2 className="text-[22px] font-semibold text-[#222222]">{t('home.noResults')}</h2>
      <p className="mx-auto mt-2 max-w-md text-[#6A6A6A]">{t('home.noResultsHint')}</p>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="mt-6 rounded-lg border border-[#222222] px-6 py-3 font-semibold text-[#222222] hover:bg-[#F7F7F7]"
        >
          {t('home.clearSearch')}
        </button>
      )}
    </div>
  );
}

/** true from 1024px: the results list and the map fit side by side. */
const WIDE_QUERY = '(min-width: 1024px)';
function useIsWide() {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(WIDE_QUERY);
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    },
    () => window.matchMedia(WIDE_QUERY).matches,
  );
}

/** The "All" homepage: sliders built from the listings, like Airbnb's. Rows without enough data are skipped. */
function FeaturedRows({ result, weekend, filters }) {
  const { t } = useI18n();
  const stays = result.properties;
  const homes = stays.filter((property) => property.property_type !== 'hotel');
  const hotels = stays.filter((property) => property.property_type === 'hotel');

  const destinations = citiesByCount(stays);
  const [firstCity, secondCity] = citiesByCount(homes).filter(({ count }) => count >= 2);
  const weekendCity = citiesByCount(result.weekendStays)[0];

  const homesIn = (place) =>
    place && (
      <Carousel title={t('row.popularHomesIn', { city: place.city })} to={homeLink({ category: 'homes', location: place.city })}>
        {homes
          .filter((property) => property.city === place.city)
          .map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
      </Carousel>
    );

  return (
    <>
      {destinations.length > 0 ? (
        <Carousel title={t('row.destinations')} size="small" actions={filters}>
          {destinations.map(({ city, count }) => (
            <DestinationCard key={city} city={city} count={count} />
          ))}
        </Carousel>
      ) : (
        <div className="mb-6 flex justify-end">{filters}</div>
      )}

      {homesIn(firstCity)}

      {weekendCity && (
        <Carousel
          title={t(weekend.thisWeek ? 'row.weekendThis' : 'row.weekendNext', { city: weekendCity.city })}
          to={homeLink({ location: weekendCity.city, check_in: weekend.check_in, check_out: weekend.check_out })}
        >
          {result.weekendStays
            .filter((property) => property.city === weekendCity.city)
            .map((property) => (
              <PropertyCard key={property.id} property={property} nights={2} />
            ))}
        </Carousel>
      )}

      {homesIn(secondCity)}

      {hotels.length > 0 && (
        <Carousel title={t('row.hotels')} to={homeLink({ category: 'hotels' })}>
          {hotels.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </Carousel>
      )}

      <OfferingCarousel kind="experiences" items={result.experiences} search={EMPTY_SEARCH} />
      <OfferingCarousel kind="services" items={result.services} search={EMPTY_SEARCH} />
    </>
  );
}

/** "Destinations for you" card: a city with how many stays it has; opens the search for that city. */
function DestinationCard({ city, count }) {
  const { t, locale } = useI18n();
  const { icon, tint } = cityStyle(city);

  return (
    <Link to={homeLink({ location: city })} className="group block">
      <div className={`flex aspect-[1.05] items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br ${tint}`}>
        <span aria-hidden="true" className="text-5xl transition-transform duration-300 group-hover:scale-110">
          {icon}
        </span>
      </div>
      <p className="mt-2 truncate text-[13px] font-semibold text-[#222222]">{city}</p>
      <p className="truncate text-[12px] text-[#6A6A6A]">{countLabel(t, locale, 'row.stays', count)}</p>
    </Link>
  );
}

/** Experiences / services slider; "→" opens that tab, keeping where / who from the search. */
function OfferingCarousel({ kind, items, search }) {
  const { t } = useI18n();
  if (items.length === 0) return null;

  return (
    <Carousel title={t(`row.${kind}`)} to={{ pathname: '/', search: toSearchParams({ ...search, category: kind }).toString() }}>
      {items.slice(0, 12).map((offering) => (
        <OfferingCard key={offering.id} offering={offering} kind={kind} />
      ))}
    </Carousel>
  );
}
