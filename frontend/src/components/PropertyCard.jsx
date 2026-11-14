import { Link } from 'react-router';

const LOCAL_PHOTOS = ['/1.jpg', '/2.jpg', '/3.jpg', '/4.jpg', '/5.jpg'];

const TYPE_LABELS = {
  apartment: 'Квартира',
  house: 'Дом',
  villa: 'Вилла',
  cabin: 'Коттедж',
  studio: 'Студия',
};

export default function PropertyCard({ property }) {
  const rawUrl = property.primary_image?.url;
  const fallbackPhoto = LOCAL_PHOTOS[property.id % LOCAL_PHOTOS.length];
  const imageUrl = !rawUrl || rawUrl.includes('picsum.photos') ? fallbackPhoto : rawUrl;

  const typeLabel = TYPE_LABELS[property.property_type] || 'Жилье';

  return (
    <Link to={`/properties/${property.id}`} className="group block">
      {/* Квадратная карточка с мягким скруглением rounded-2xl как на скриншоте */}
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-100">
        <img
          src={imageUrl}
          alt={property.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Бейдж "Выбор гостей" */}
        {property.id % 2 === 0 && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[#222222] shadow-sm">
            Выбор гостей
          </span>
        )}

        {/* Фирменное сердечко в правом верхнем углу */}
        <button
          type="button"
          onClick={(e) => e.preventDefault()}
          className="absolute right-2.5 top-2.5 transition-transform hover:scale-110 active:scale-90"
          aria-label="В избранное"
        >
          <svg
            viewBox="0 0 32 32"
            className="h-5 w-5 fill-black/45 stroke-white stroke-[2px]"
          >
            <path d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 0 0-7-7c-1.8 0-3.58.68-4.95 2.05L16 8.1l-2.05-2.05a6.98 6.98 0 0 0-9.9 0A6.98 6.98 0 0 0 2 11c0 7 7 12.27 14 17z" />
          </svg>
        </button>
      </div>

      {/* Минималистичный текст под фото: ровно 2 компактные строчки */}
      <div className="mt-2 space-y-0.5">
        <h3 className="truncate text-[14px] font-semibold leading-tight text-[#222222]">
          {typeLabel}, {property.city}
        </h3>
        <p className="truncate text-[13px] leading-tight text-[#6A6A6A]">
          ${Number(property.price_per_night).toFixed(0)} USD за ночь · ★ 4,95
        </p>
      </div>
    </Link>
  );
}
