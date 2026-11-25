// Experiences and services (homepage tabs + their details page). The API sends `category` as a code
// (see backend App\Enums\ExperienceCategory / ServiceCategory); the look and the names live here and in i18n.

/** Seeded offerings have no photo yet: a coloured tile with an icon per category stands in. */
const STYLES = {
  food: { icon: '🍝', tint: 'from-[#FFE9D9] to-[#FFC9A8]' },
  tours: { icon: '🗺️', tint: 'from-[#E3F0FF] to-[#B9D6FF]' },
  art: { icon: '🎨', tint: 'from-[#F7E6FF] to-[#E1BDF7]' },
  outdoors: { icon: '🥾', tint: 'from-[#E4F6E6] to-[#B8E2BF]' },
  wellness: { icon: '🧘', tint: 'from-[#E6F7F5] to-[#B5E5DF]' },
  chef: { icon: '🍳', tint: 'from-[#FFF3D6] to-[#FFDE96]' },
  photography: { icon: '📷', tint: 'from-[#ECECF4] to-[#CACAE0]' },
  massage: { icon: '💆', tint: 'from-[#FFE6EC] to-[#FFC0CF]' },
  training: { icon: '🏋️', tint: 'from-[#E2F3FF] to-[#AEDBFF]' },
  makeup: { icon: '💄', tint: 'from-[#FFE4F1] to-[#FBB8D8]' },
}

export function offeringStyle(category) {
  return STYLES[category] ?? { icon: '✨', tint: 'from-[#F2F2F2] to-[#DDDDDD]' }
}

/** kind = 'experiences' | 'services' (also the URL segment: /experiences/3). */
export function offeringCategoryLabel(t, kind, category) {
  const key = `${kind === 'services' ? 'serviceCategory' : 'experienceCategory'}.${category}`
  const label = t(key)
  return label === key ? category : label
}

/** 90 -> "1.5 hr" / "1,5 h" / "1,5 ч" */
export function formatDuration(minutes, locale) {
  return new Intl.NumberFormat(locale, { style: 'unit', unit: 'hour', unitDisplay: 'short', maximumFractionDigits: 1 }).format(minutes / 60)
}

/** Same format as the listing cards. */
export const formatPrice = (price) => `$${Number(price).toFixed(0)} USD`
