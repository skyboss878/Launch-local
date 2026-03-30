import { useState, useEffect } from 'react';
import axios from 'axios';
import { CategoryCard } from '../components/CategoryCard';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API}/categories`);
        setCategories(res.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Header */}
      <div className="bg-[#1C1917] text-white py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-heading text-4xl sm:text-5xl font-medium tracking-tight mb-4">
            Shop by Category
          </h1>
          <p className="text-stone-400 max-w-xl">
            Find exactly what you're looking for. Browse our carefully organized categories.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`skeleton ${i < 2 ? 'md:col-span-6 aspect-[2/1]' : 'md:col-span-4 aspect-[4/3]'}`} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6" data-testid="categories-grid">
            {categories.slice(0, 2).map((cat, i) => (
              <div key={cat.id} className={`animate-fade-in stagger-${i + 1}`}>
                <CategoryCard category={cat} size="large" />
              </div>
            ))}
            {categories.slice(2).map((cat, i) => (
              <div key={cat.id} className={`animate-fade-in stagger-${i + 3}`}>
                <CategoryCard category={cat} size="default" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
