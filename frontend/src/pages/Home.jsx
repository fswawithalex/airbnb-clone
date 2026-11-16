import { useEffect, useState } from 'react';
import api from '../lib/api.js';
import PropertyCard from '../components/PropertyCard.jsx';

export default function Home() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get('/properties')
      .then((response) => setProperties(response.data))
      .catch((err) => setError(err.response?.data?.message ?? err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="py-16 text-center text-sm text-[#6A6A6A]">Загрузка жилья...</div>;
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
        Ошибка загрузки квартир: {error}
      </div>
    );
  }

  return (
    <section className="py-4">
      <h2 className="mb-4 text-lg font-semibold text-[#222222]">
        Популярное жилье →
      </h2>

      {/* Плотность сетки 1-в-1 как на новом Airbnb (до 7 карточек в ряд) */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </section>
  );
}
