import { Link } from 'react-router'
import { useI18n } from '../i18n/I18nContext.jsx'
import { formatRating } from '../lib/listing.js'
import { formatDuration, formatPrice, offeringCategoryLabel, offeringStyle } from '../lib/offerings.js'

/** Card for an experience or a service (kind = 'experiences' | 'services'), same size and text style as PropertyCard. */
export default function OfferingCard({ offering, kind, className = '' }) {
  const { t, locale } = useI18n()
  const { icon, tint } = offeringStyle(offering.category)

  return (
    <Link to={`/${kind}/${offering.id}`} className={`group block ${className}`}>
      <div className={`relative flex aspect-[20/19] w-full items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br ${tint}`}>
        {offering.image_url ? (
          <img
            src={offering.image_url}
            alt={offering.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span aria-hidden="true" className="text-6xl transition-transform duration-300 group-hover:scale-110">
            {icon}
          </span>
        )}
        <span className="absolute left-2.5 top-2.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[#222222] shadow-sm">
          {offeringCategoryLabel(t, kind, offering.category)}
        </span>
      </div>

      <div className="mt-2 space-y-0.5">
        <h3 className="line-clamp-2 text-[13px] font-semibold leading-tight text-[#222222]">{offering.title}</h3>
        <p className="truncate text-[12px] leading-tight text-[#6A6A6A]">
          {offering.city} · {formatDuration(offering.duration_minutes, locale)}
        </p>
        <p className="truncate text-[12px] leading-tight text-[#6A6A6A]">
          {t('offering.pricePerGuest', { price: formatPrice(offering.price) })} · ★ {formatRating(locale)}
        </p>
      </div>
    </Link>
  )
}
