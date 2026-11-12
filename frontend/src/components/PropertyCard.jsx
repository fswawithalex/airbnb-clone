import { Link } from 'react-router';

// Массив красивых настоящих фото домов, чтобы карточки выглядели по-разному
const REAL_PHOTOS = [
  'https://pexels.com',
  'https://pexels.com',
  'https://pexels.com',
  'https://pexels.com',
];

export default function PropertyCard({ property }) {
  // Выбираем разное красивое фото в зависимости от ID квартиры
  const fallbackPhoto = REAL_PHOTOS[property.id % REAL_PHOTOS.length];

  return (
    <Link to={`/properties/${property.id}`} className="group block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-lg">
      <div className="aspect-[4/3] overflow-hidden bg-gray-100">
        <img
          src={property.primary_image?.url || fallbackPhoto}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = fallbackPhoto;
          }}
          alt={property.title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      </div>

      <div className="p-4">
        <h3 className="truncate text-lg font-semibold text-gray-900">
          {property.title}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {property.city}, {property.country}
        </p>
        <p className="mt-1 text-xs text-gray-400">
          {property.max_guests} гостей · {property.bedrooms} спальни
        </p>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-lg font-bold text-gray-900">${property.price_per_night}</span>
          <span className="text-sm text-gray-600">/ ночь</span>
        </div>
      </div>
    </Link>
  );
}
