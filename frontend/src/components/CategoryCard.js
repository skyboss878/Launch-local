import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function CategoryCard({ category, size = 'default' }) {
  const sizeClasses = {
    large: 'md:col-span-6 aspect-[16/9] md:aspect-[2/1]',
    default: 'md:col-span-4 aspect-square md:aspect-[4/3]',
    small: 'md:col-span-3 aspect-square'
  };

  return (
    <Link
      to={`/shop?category=${category.id}`}
      className={`category-card group relative block rounded-2xl overflow-hidden ${sizeClasses[size]}`}
      data-testid={`category-card-${category.id}`}
    >
      <img 
        src={category.image} 
        alt={category.name}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="category-overlay absolute inset-0 bg-black/30 flex items-end p-6">
        <div className="flex items-center justify-between w-full">
          <div>
            <h3 className="font-heading text-white text-xl md:text-2xl font-bold">
              {category.name}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center transform translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
            <ArrowRight className="text-white" size={20} />
          </div>
        </div>
      </div>
    </Link>
  );
}
