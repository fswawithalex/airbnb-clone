import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import api from '../lib/api.js'
import { useI18n } from '../i18n/I18nContext.jsx'
import { formatRating } from '../lib/listing.js'
import { formatDuration, formatPrice, offeringCategoryLabel, offeringStyle } from '../lib/offerings.js'

/** /experiences/:id and /services/:id (kind = 'experiences' | 'services'). Read-only: they can't be booked yet. */
export default function OfferingDetails({ kind }) {
  const { t, locale } = useI18n()
  const { id } = useParams()
  // `key` = which offering the state belongs to, so a new id shows "Loading" without resetting state in the effect
  const [result, setResult] = useState({ key: null, offering: null })
  const key = `${kind}/${id}`

  useEffect(() => {
    let active = true
    api
      .get(`/${kind}/${id}`)
      .then((response) => active && setResult({ key, offering: response.data }))
      .catch(() => active && setResult({ key, offering: null }))
    return () => {
      active = false
    }
  }, [kind, id, key])

  if (result.key !== key) return <div className="py-16 text-center text-sm text-[#6A6A6A]">{t('common.loading')}</div>
  const offering = result.offering
  if (!offering) return <div className="py-16 text-center text-sm text-red-500">{t('listing.notFound')}</div>

  const { icon, tint } = offeringStyle(offering.category)

  return (
    <div className="mx-auto max-w-6xl pb-16 pt-2 text-[#222222]">
      <h1 className="mt-4 text-[26px] font-semibold leading-tight">{offering.title}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold">★ {formatRating(locale)}</span>
        <span>·</span>
        <span className="font-semibold underline">
          {offering.city}, {offering.country}
        </span>
        <span>·</span>
        <span className="text-[#6A6A6A]">{offeringCategoryLabel(t, kind, offering.category)}</span>
      </div>

      <div className={`mt-6 flex h-64 items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br md:h-96 ${tint}`}>
        {offering.image_url ? (
          <img src={offering.image_url} alt={offering.title} className="h-full w-full object-cover" />
        ) : (
          <span aria-hidden="true" className="text-[120px]">
            {icon}
          </span>
        )}
      </div>

      <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-[22px] font-semibold">{t('offering.hostedBy', { name: offering.host?.name ?? '' })}</h2>
            <p className="mt-1 text-base">
              {t('offering.duration', { duration: formatDuration(offering.duration_minutes, locale) })} ·{' '}
              {t('offering.maxGuests', { count: offering.max_guests })}
            </p>
          </div>
          <div className="py-6">
            <h3 className="mb-3 text-[22px] font-semibold">{t('offering.about')}</h3>
            <p className="whitespace-pre-line text-base leading-relaxed">{offering.description}</p>
          </div>
        </div>

        <div>
          <div className="rounded-2xl border border-[#DDDDDD] p-6 shadow-[0_6px_16px_rgba(0,0,0,0.12)] lg:sticky lg:top-8">
            <p className="text-[22px] font-semibold">{t('offering.pricePerGuest', { price: formatPrice(offering.price) })}</p>
            <p className="mt-4 rounded-lg bg-[#F7F7F7] p-3 text-sm text-[#6A6A6A]">{t('offering.notBookable')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
