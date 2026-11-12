import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import api from '../lib/api.js';

const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://w3.org' width='800' height='500' viewBox='0 0 800 500'%3E%3Crect fill='%23f3f4f6' width='800' height='500'/%3E%3Cpath fill='%23fb7185' d='M400 150 L260 270 H300 V370 H370 V300 H430 V370 H500 V270 H540 Z'/%3E%3Ctext x='400' y='430' font-family='sans-serif' font-size='24' fill='%236b7280' text-anchor='middle'%3EAirbnb Property%3C/text%3E%3C/svg%3E";

export default function PropertyDetails() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/properties/${id}`)
      .then((res) => setProperty(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="py-12 text-center text-gray-500">Загрузка квартиры...</div>;
  if (!property) return <div className="py-12 text-center text-red-500">Жилье не найдено</div>;

  return (
    <div className="max-w-5xl mx-auto py-4">
      <Link to="/" className="text-sm font-medium text-rose-600 hover:underline">
        ← Назад ко всем вариантам
      </Link>
      
      <h1 className="text-3xl font-bold text-gray-900 mt-4">{property.title}</h1>
      <p className="text-gray-600 mt-1">{property.city}, {property.country} · {property.address}</p>

      {/* Галерея фото */}
            {/* Красивая сетка фотографий */}
      <div className="mt-6 grid grid-cols-1 gap-3 overflow-hidden rounded-2xl md:grid-cols-2">
        {(property.images?.length > 0 ? property.images : [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]).map((img, index) => {
          const galleryPhotos = [
            'https://pexels.com',
            'https://pexels.com',
            'https://pexels.com',
            'https://pexels.com',
          ];
          const fallback = galleryPhotos[index % galleryPhotos.length];

          return (
            <img
              key={img.id || index}
              src={img.url || fallback}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = fallback;
              }}
              alt={property.title}
              className="h-64 w-full object-cover bg-gray-100"
            />
          );
        })}
      </div>


      {/* Описание и место для бронирования */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
        <div className="md:col-span-2">
          <h2 className="text-xl font-semibold">Хозяин: {property.host?.name || 'Неизвестен'}</h2>
          <p className="text-gray-500 text-sm mt-1">
            {property.max_guests} гостей · {property.bedrooms} спален · {property.beds} кроватей · {property.bathrooms} ванных
          </p>
          
          <hr className="my-6" />
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">{property.description}</p>

          {/* Удобства (Amenities) */}
          {property.amenities?.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-3">Удобства в этом жилье</h3>
              <div className="grid grid-cols-2 gap-2">
                {property.amenities.map((amenity) => (
                  <div key={amenity.id} className="text-gray-700 text-sm">✓ {amenity.name}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Блок-заглушка для Разработчика 4 (Бронирование) */}
        <div className="border rounded-2xl p-6 shadow-md h-fit bg-white">
          <div className="text-2xl font-bold text-gray-900">
            ${property.price_per_night} <span className="text-base font-normal text-gray-500">/ ночь</span>
          </div>
          <div className="mt-4 p-4 bg-gray-50 rounded-xl text-center text-sm text-gray-500 border border-dashed">
            Здесь Разработчик 4 добавит календарь и кнопку «Забронировать»
          </div>
        </div>
      </div>
    </div>
  );
}
