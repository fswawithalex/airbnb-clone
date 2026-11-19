import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import api from '../lib/api.js';

import DateRangePicker from '../components/booking/DateRangePicker.jsx';
import GuestSelector from '../components/booking/GuestSelector.jsx';

const LOCAL_PHOTOS = ['/1.jpg', '/2.jpg', '/3.jpg', '/4.jpg', '/5.jpg'];

export default function PropertyDetails() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);

  useEffect(() => {
    api
      .get(`/properties/${id}`)
      .then((res) => setProperty(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="py-16 text-center text-sm text-[#6A6A6A]">Загрузка...</div>;
  if (!property) return <div className="py-16 text-center text-sm text-red-500">Жилье не найдено</div>;

  // Формируем 5 фото для фирменного коллажа Airbnb
  const photos = Array.from({ length: 5 }, (_, idx) => {
    const dbImg = property.images?.[idx]?.url;
    return !dbImg || dbImg.includes('picsum.photos') ? LOCAL_PHOTOS[idx % LOCAL_PHOTOS.length] : dbImg; // improve this to be better, maybe add a checker if there are 4 photos then only should be shown only 4
  });

  return (
    <div className="mx-auto max-w-6xl pb-16 pt-2 text-[#222222]">

      {/* Заголовок и рейтинг */}
      <div className="mt-4">
        <h1 className="text-[26px] font-semibold leading-tight">{property.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold">★ 4,95</span>
          <span>·</span>
          <span className="font-semibold underline">
            {property.city}, {property.country}
          </span>
          <span>·</span>
          <span className="text-[#6A6A6A]">{property.address}</span>
        </div>
      </div>

      {/* Фирменный коллаж из 5 фото (1 большое слева + 4 справа) */}
      <div className="mt-6 grid grid-cols-1 gap-2 overflow-hidden rounded-2xl md:h-[400px] md:grid-cols-4 md:grid-rows-2">
                <div className="md:col-span-2 md:row-span-2">
          <img
            src={photos[0]}
            alt={property.title}
            className="h-64 w-full object-cover transition hover:brightness-90 md:h-full"
          />
        </div>

        {photos.slice(1, 5).map((photoUrl, idx) => (
          <div key={idx} className="hidden md:block">
            <img
              src={photoUrl}
              alt={`${property.title} ${idx + 2}`}
              className="h-full w-full object-cover transition hover:brightness-90"
            />
          </div>
        ))}
      </div>

      {/* Описание и карточка бронирования */}
      <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Информация о хозяине */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-6">
            <div>
              <h2 className="text-[22px] font-semibold">
                Жилье целиком · Хозяин: {property.host?.name || 'Alex'}
              </h2>
              <p className="mt-1 text-base text-[#222222]">
                {property.max_guests} гостей · {property.bedrooms} спален · {property.beds} кроватей · {property.bathrooms} ванных
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#222222] text-lg font-semibold text-white">
              {(property.host?.name || 'H').toUpperCase()}
            </div>
          </div>

          {/* Описание */}
          <div className="border-b border-gray-200 py-6">
            <p className="whitespace-pre-line text-base leading-relaxed text-[#222222]">
              {property.description}
            </p>
          </div>

          {/* Удобства */}
          {property.amenities?.length > 0 && (
            <div className="py-6">
              <h3 className="mb-4 text-[22px] font-semibold">Какие удобства вас ждут</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {property.amenities.map((amenity) => (
                  <div key={amenity.id} className="flex items-center gap-3 text-base">
                    <span className="text-lg">✓</span>
                    <span>{amenity.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Липкая карточка бронирования (место для Разработчика 4) */}
        <div>
          <div className="sticky top-24 rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-[22px] font-semibold">
                  ${Number(property.price_per_night).toFixed(0)}
                </span>{' '}
                <span className="text-base text-[#222222]">ночь</span>
              </div>
              <span className="text-sm font-semibold">★ 4,95</span>
            </div>

            <div className="mt-5 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-[#6A6A6A]">
              <DateRangePicker
                checkIn={checkIn}
                checkOut={checkOut}
                onCheckInChange={setCheckIn}
                onCheckOutChange={setCheckOut}
              />

              <GuestSelector
                guests={guests}
                maxGuests={Number(property.max_guests)}
                onChange={setGuests}
              />
            </div>

            <button
              type="button"
              disabled
              className="mt-4 w-full cursor-not-allowed rounded-lg bg-[#FF385C] py-3.5 text-base font-semibold text-white"
            >
              Забронировать
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
