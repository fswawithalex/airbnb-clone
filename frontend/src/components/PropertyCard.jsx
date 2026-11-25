import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nContext.jsx';
import { cardPhoto, countLabel, priceLabel, propertyTypeLabel, ratingLabel } from '../lib/listing.js';

/**
 * Listing card.
 * - `nights` (optional): with dates chosen, show the stay's total ("$356 USD for 2 nights") instead of the nightly price.
 * - `variant="detailed"`: search results next to the map, like Airbnb: wider photo, rating with the number of
 *   reviews, the listing's own title and its rooms ("1 bedroom · 1 bed · 1 bath").
 */
export default function PropertyCard({ property, nights = 0, variant = 'compact' }) {
  const { t, locale } = useI18n();
  const detailed = variant === 'detailed';
  const heading = t('listing.typeInCity', { type: propertyTypeLabel(t, property.property_type), city: property.city });

  return (
    <Link to={`/properties/${property.id}`} className="group block">
      {/* Квадратная карточка с мягким скруглением rounded-2xl как на скриншоте */}
      <div className={`relative w-full overflow-hidden rounded-2xl bg-gray-100 ${detailed ? 'aspect-[4/3]' : 'aspect-[20/19]'}`}>
        <img
          src={cardPhoto(property)}
          alt={property.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Бейдж "Выбор гостей" */}
        {property.id % 2 === 0 && (
          <span
            className={`absolute left-2.5 top-2.5 rounded-full bg-white/95 px-2.5 py-1 font-semibold text-[#222222] shadow-sm ${
              detailed ? 'text-[13px]' : 'text-[11px]'
            }`}
          >
            {t('listing.guestFavourite')}
          </span>
        )}

        {/* Фирменное сердечко в правом верхнем углу */}
        <button
          type="button"
          onClick={(e) => e.preventDefault()}
          className="absolute right-2.5 top-2.5 transition-transform hover:scale-110 active:scale-90"
          aria-label={t('listing.save')}
        >
          <svg viewBox="0 0 32 32" className={`fill-black/45 stroke-white stroke-[2px] ${detailed ? 'h-6 w-6' : 'h-5 w-5'}`}>
            <path d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 0 0-7-7c-1.8 0-3.58.68-4.95 2.05L16 8.1l-2.05-2.05a6.98 6.98 0 0 0-9.9 0A6.98 6.98 0 0 0 2 11c0 7 7 12.27 14 17z" />
          </svg>
        </button>
      </div>

      {detailed ? (
        <div className="mt-3 text-[15px] leading-snug">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="truncate font-semibold text-[#222222]">{heading}</h3>
            <span className="shrink-0 text-[#222222]">{ratingLabel(t, locale, property, true)}</span>
          </div>
          <p className="truncate text-[#6A6A6A]">{property.title}</p>
          <p className="truncate text-[#6A6A6A]">
            {[
              countLabel(t, locale, 'listing.bedrooms', property.bedrooms),
              countLabel(t, locale, 'listing.beds', property.beds),
              countLabel(t, locale, 'listing.bathrooms', property.bathrooms),
            ].join(' · ')}
          </p>
          <p className="mt-1.5 truncate text-[#222222]">
            <span className="font-semibold underline">{priceLabel(t, locale, property, nights)}</span>
          </p>
        </div>
      ) : (
        /* Минималистичный текст под фото: ровно 2 компактные строчки */
        <div className="mt-2 space-y-0.5">
          <h3 className="truncate text-[13px] font-semibold leading-tight text-[#222222]">{heading}</h3>
          <p className="truncate text-[12px] leading-tight text-[#6A6A6A]">
            {priceLabel(t, locale, property, nights)} · {ratingLabel(t, locale, property)}
          </p>
        </div>
      )}
    </Link>
  );
}
