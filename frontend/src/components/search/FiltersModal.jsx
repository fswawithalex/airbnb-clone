import { useEffect, useState } from 'react'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { amenityLabel as translateAmenity, propertyTypeLabel } from '../../lib/listing.js'
import { BEDROOM_OPTIONS, PROPERTY_TYPES, clearFilters, loadAmenities } from '../../lib/search.js'
import Button from '../ui/Button.jsx'
import Modal from '../ui/Modal.jsx'

/**
 * Filters dialog: price range, property type, bedrooms, amenities.
 * Works on a draft copy; nothing changes until "Show places". Mount it only while open.
 */
export default function FiltersModal({ initial, onApply, onClose }) {
  const { t, locale } = useI18n()
  const [draft, setDraft] = useState(initial)
  const [amenities, setAmenities] = useState(null)
  const [amenitiesFailed, setAmenitiesFailed] = useState(false)

  useEffect(() => {
    let active = true
    loadAmenities()
      .then((list) => active && setAmenities(list))
      .catch(() => active && setAmenitiesFailed(true))
    return () => {
      active = false
    }
  }, [])

  const set = (key, value) => setDraft((current) => ({ ...current, [key]: value }))
  const toggle = (key, value) =>
    setDraft((current) => ({
      ...current,
      [key]: current[key].includes(value) ? current[key].filter((item) => item !== value) : [...current[key], value],
    }))

  const apply = () => {
    const price = (value) => (value === '' || Number(value) < 0 ? '' : String(value))
    let minPrice = price(draft.min_price)
    let maxPrice = price(draft.max_price)
    // Typed the other way round? Swap instead of failing validation
    if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) [minPrice, maxPrice] = [maxPrice, minPrice]
    onApply({ ...draft, min_price: minPrice, max_price: maxPrice })
  }

  const amenityLabel = (amenity) => translateAmenity(t, amenity)

  const footer = (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={() => setDraft(clearFilters(draft))}
        className="rounded-lg px-2 py-2 text-base font-semibold text-[#222222] underline hover:bg-[#F7F7F7]"
      >
        {t('filters.clear')}
      </button>
      <Button type="button" variant="dark" onClick={apply}>
        {t('filters.show')}
      </Button>
    </div>
  )

  return (
    <Modal open title={t('filters.title')} onClose={onClose} size="lg" footer={footer}>
      <Section title={t('filters.price')} hint={t('filters.priceHint')}>
        <div className="flex items-center gap-4">
          <PriceInput label={t('filters.min')} value={draft.min_price} onChange={(value) => set('min_price', value)} />
          <span className="text-[#6A6A6A]" aria-hidden="true">
            –
          </span>
          <PriceInput label={t('filters.max')} value={draft.max_price} onChange={(value) => set('max_price', value)} />
        </div>
      </Section>

      <Section title={t('filters.type')}>
        <div className="flex flex-wrap gap-2">
          {PROPERTY_TYPES.map((type) => (
            <Chip key={type} selected={draft.types.includes(type)} onClick={() => toggle('types', type)}>
              {propertyTypeLabel(t, type)}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title={t('filters.bedrooms')}>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('filters.bedrooms')}>
          {BEDROOM_OPTIONS.map((option, index) => (
            <Chip key={option || 'any'} role="radio" selected={draft.bedrooms === option} onClick={() => set('bedrooms', option)}>
              {option === '' ? t('filters.any') : index === BEDROOM_OPTIONS.length - 1 ? `${option}+` : option}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title={t('filters.amenities')}>
        {amenitiesFailed ? (
          <p className="text-sm text-[#C13515]">{t('filters.amenitiesError')}</p>
        ) : !amenities ? (
          <p className="text-sm text-[#6A6A6A]">{t('common.loading')}</p>
        ) : (
          <div className="grid gap-x-6 sm:grid-cols-2">
            {/* The API sorts by English name; sort again by the label actually shown */}
            {[...amenities].sort((a, b) => amenityLabel(a).localeCompare(amenityLabel(b), locale)).map((amenity) => (
              <label key={amenity.id} className="flex cursor-pointer items-center gap-4 py-3 text-base text-[#222222]">
                <input
                  type="checkbox"
                  checked={draft.amenities.includes(String(amenity.id))}
                  onChange={() => toggle('amenities', String(amenity.id))}
                  className="h-6 w-6 shrink-0 cursor-pointer accent-[#222222]"
                />
                {amenityLabel(amenity)}
              </label>
            ))}
          </div>
        )}
      </Section>
    </Modal>
  )
}

function Section({ title, hint, children }) {
  return (
    <section className="border-b border-[#EBEBEB] py-8 first:pt-0 last:border-0 last:pb-0">
      <h3 className="text-[22px] font-semibold text-[#222222]">{title}</h3>
      {hint && <p className="mt-1 text-sm text-[#6A6A6A]">{hint}</p>}
      <div className="mt-5">{children}</div>
    </section>
  )
}

function Chip({ selected, children, role, ...props }) {
  return (
    <button
      type="button"
      role={role}
      aria-pressed={role ? undefined : selected}
      aria-checked={role ? selected : undefined}
      className={`rounded-full border px-5 py-2.5 text-sm transition ${
        selected ? 'border-[#222222] bg-[#222222] text-white' : 'border-[#DDDDDD] text-[#222222] hover:border-[#222222]'
      }`}
      {...props}
    >
      {children}
    </button>
  )
}

function PriceInput({ label, value, onChange }) {
  return (
    <label className="flex-1 rounded-lg border border-[#B0B0B0] px-3 py-2 focus-within:border-[#222222] focus-within:ring-1 focus-within:ring-[#222222]">
      <span className="block text-xs text-[#6A6A6A]">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min="0"
        step="1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-base text-[#222222] outline-none"
      />
    </label>
  )
}
