import { useEffect, useMemo } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { Link } from 'react-router'
import { useI18n } from '../i18n/I18nContext.jsx'
import { cardPhoto, priceLabel, propertyTypeLabel, ratingLabel } from '../lib/listing.js'

// OpenStreetMap's own tiles: free, no API key; the attribution in the corner is required. Fine for development
// and light use (tile.openstreetmap.org usage policy); a public site with real traffic should use a tile provider.
// (CARTO's free tiles now show "API key required".)
const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

const ROMANIA = [45.9, 24.9]

/** "$185" pill on the map; dark when its card is hovered in the list (`active`). */
function priceIcon(price, active) {
  return L.divIcon({
    className: '', // no Leaflet default box
    iconSize: [0, 0],
    html: `<span class="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full px-2.5 py-1 text-sm font-semibold shadow-[0_2px_6px_rgba(0,0,0,0.25)] transition-transform ${
      active ? 'z-10 scale-110 bg-[#222222] text-white' : 'bg-white text-[#222222] hover:scale-110'
    }">${price}</span>`,
  })
}

/** Zoom the map to show every result (again whenever the results change; `points` is memoized). */
function FitToResults({ points }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 1) map.setView(points[0], 13)
    else if (points.length > 1) map.fitBounds(points, { padding: [48, 48], maxZoom: 14 })
  }, [map, points])
  return null
}

/**
 * Map next to the search results: a price pill per listing (with coordinates); clicking one opens a small card.
 * `hoveredId` = the listing whose card the mouse is over in the list.
 */
export default function ResultsMap({ properties, nights = 0, hoveredId = null }) {
  const { t, locale } = useI18n()
  const located = useMemo(() => properties.filter((p) => p.latitude !== null && p.longitude !== null), [properties])
  // Same array until the results change, so the map isn't re-zoomed while you hover cards
  const points = useMemo(() => located.map((p) => [Number(p.latitude), Number(p.longitude)]), [located])

  return (
    // z-0: Leaflet's layers use z-index 400+, keep them under the fixed header and dialogs
    <div className="relative z-0 h-full w-full overflow-hidden rounded-2xl">
      <MapContainer center={points[0] ?? ROMANIA} zoom={6} scrollWheelZoom className="h-full w-full">
        <TileLayer url={TILES} attribution={ATTRIBUTION} />
        <FitToResults points={points} />
        {located.map((property) => (
          <Marker
            key={property.id}
            position={[Number(property.latitude), Number(property.longitude)]}
            icon={priceIcon(`$${Math.round(Number(property.price_per_night) * (nights || 1))}`, property.id === hoveredId)}
            zIndexOffset={property.id === hoveredId ? 1000 : 0}
          >
            <Popup closeButton={false} minWidth={240} maxWidth={240} className="[&_.leaflet-popup-content]:m-0 [&_.leaflet-popup-content-wrapper]:overflow-hidden [&_.leaflet-popup-content-wrapper]:rounded-2xl [&_.leaflet-popup-content-wrapper]:p-0">
              {/* `!`: Leaflet's own CSS colours every link in the map blue */}
              <Link to={`/properties/${property.id}`} className="block text-[#222222]! no-underline">

                <img src={cardPhoto(property)} alt={property.title} className="aspect-[4/3] w-full object-cover" />
                <div className="space-y-0.5 p-3 text-[13px] leading-snug">
                  <div className="flex justify-between gap-2">
                    <span className="truncate font-semibold">
                      {t('listing.typeInCity', { type: propertyTypeLabel(t, property.property_type), city: property.city })}
                    </span>
                    <span className="shrink-0">{ratingLabel(t, locale, property)}</span>
                  </div>
                  <span className="block truncate text-[#6A6A6A]">{property.title}</span>
                  <span className="block font-semibold">{priceLabel(t, locale, property, nights)}</span>
                </div>
              </Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
