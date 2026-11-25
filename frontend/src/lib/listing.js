// Labels for listing data the API sends as codes or English names (property types, amenities, room counts).
// Each takes `t` (and `locale`) from useI18n(), so the text follows the language picked in the header.

export const DEMO_RATING = 4.95 // reviews aren't wired to the cards yet

/** 'villa' -> "Villa" / "Vilă" / "Вилла"; unknown types -> "Place". */
export function propertyTypeLabel(t, type) {
  const key = `propertyType.${type}`
  const label = t(key)
  return label === key ? t('listing.place') : label
}

/** Translated by icon name (see backend AmenitySeeder); amenities without a translation keep their DB name. */
export function amenityLabel(t, amenity) {
  const key = `amenity.${amenity.icon}`
  const label = t(key)
  return label === key ? amenity.name : label
}

/**
 * "1 guest" / "3 guests", with the plural form the language needs: looks up `${key}_one|few|many|other`
 * (en uses one/other, ro one/few/other, ru one/few/many/other). Decimals like 1.5 bathrooms are fine.
 */
export function countLabel(t, locale, key, count, extraVars = {}) {
  const value = Number(count)
  const vars = { ...extraVars, count: new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value) }
  const formKey = `${key}_${new Intl.PluralRules(locale).select(value)}`
  const text = t(formKey, vars)
  return text === formKey ? t(`${key}_other`, vars) : text
}

/** 4.95 -> "4.95" (en) / "4,95" (ro, ru). */
export function formatRating(locale, rating = DEMO_RATING) {
  return new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(rating)
}

/**
 * "★ 4.5" from the listing's reviews (GET /api/properties sends reviews_avg_rating + reviews_count),
 * "★ New" without any; `withCount` adds "(12)" like the search results.
 */
export function ratingLabel(t, locale, property, withCount = false) {
  if (!property.reviews_count) return `★ ${t('listing.new')}`
  const rating = formatRating(locale, Number(property.reviews_avg_rating))
  return withCount ? `★ ${rating} (${property.reviews_count})` : `★ ${rating}`
}

const LOCAL_PHOTOS = ['/1.jpg', '/2.jpg', '/3.jpg', '/4.jpg', '/5.jpg']

/** The card photo: the listing's main image, or one of the local photos for seeded picsum placeholders. */
export function cardPhoto(property) {
  const url = property.primary_image?.url
  return !url || url.includes('picsum.photos') ? LOCAL_PHOTOS[property.id % LOCAL_PHOTOS.length] : url
}

/** "$356 USD for 2 nights" with dates chosen, else "$178 USD per night". */
export function priceLabel(t, locale, property, nights = 0) {
  const usd = (amount) => `$${Math.round(amount)} USD`
  return nights > 0
    ? t('listing.priceForNights', {
        price: usd(Number(property.price_per_night) * nights),
        nights: countLabel(t, locale, 'listing.nights', nights),
      })
    : t('listing.pricePerNight', { price: usd(Number(property.price_per_night)) })
}
