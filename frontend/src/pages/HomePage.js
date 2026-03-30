import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, Truck, Shield, HeadphonesIcon } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { CategoryCard } from '../components/CategoryCard';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          axios.get(`${API}/products?featured=true`),
          axios.get(`${API}/categories`)
        ]);
        setFeaturedProducts(productsRes.data.slice(0, 6));
        setCategories(categoriesRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[80vh] max-h-[800px] overflow-hidden" data-testid="hero-section">
        <img 
          src="https://static.prod-images.emergentagent.com/jobs/6c023cc2-2fc0-43fb-8359-ba7aa5d1b242/images/49800f2fea2613392a45855e36288991a996c5756148b662287ac7701e1a346a.png"
          alt="Curated lifestyle space"
          className="w-full h-full object-cover"
        />
        <div className="hero-overlay absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="max-w-2xl animate-slide-up">
              <span className="text-xs tracking-[0.2em] uppercase font-bold text-white/80 mb-4 block">
                Welcome to Launch Local
              </span>
              <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-medium text-white tracking-tighter mb-6">
                Curated Quality,<br />Local Heart
              </h1>
              <p className="text-lg text-white/90 mb-8 max-w-lg leading-relaxed">
                Discover thoughtfully sourced products from trusted artisans and brands. 
                From home essentials to premium fragrances, all in one place.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link 
                  to="/shop" 
                  className="btn-primary inline-flex items-center gap-2"
                  data-testid="hero-shop-now"
                >
                  Shop Now
                  <ArrowRight size={20} />
                </Link>
                <Link 
                  to="/categories" 
                  className="bg-white/20 backdrop-blur text-white rounded-full px-6 py-3 font-medium transition-all duration-300 hover:bg-white/30"
                  data-testid="hero-categories"
                >
                  Browse Categories
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bar */}
      <section className="bg-[#4A5D4E] text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12">
            <div className="flex items-center gap-4 justify-center md:justify-start">
              <Truck size={28} />
              <div>
                <p className="font-medium">Free Shipping</p>
                <p className="text-sm text-white/70">On orders over $100</p>
              </div>
            </div>
            <div className="flex items-center gap-4 justify-center">
              <Shield size={28} />
              <div>
                <p className="font-medium">Secure Checkout</p>
                <p className="text-sm text-white/70">100% protected payment</p>
              </div>
            </div>
            <div className="flex items-center gap-4 justify-center md:justify-end">
              <HeadphonesIcon size={28} />
              <div>
                <p className="font-medium">24/7 Support</p>
                <p className="text-sm text-white/70">Dedicated assistance</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8" data-testid="categories-section">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <span className="text-xs tracking-[0.2em] uppercase font-bold text-[#57534E] mb-2 block">
                Browse by
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl font-medium text-[#1C1917] tracking-tight">
                Categories
              </h2>
            </div>
            <Link 
              to="/categories" 
              className="btn-outline hidden sm:inline-flex items-center gap-2"
              data-testid="view-all-categories"
            >
              View All
              <ArrowRight size={18} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`skeleton ${i < 2 ? 'md:col-span-6 aspect-[2/1]' : 'md:col-span-4 aspect-[4/3]'}`} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {categories.slice(0, 2).map(cat => (
                <CategoryCard key={cat.id} category={cat} size="large" />
              ))}
              {categories.slice(2, 6).map(cat => (
                <CategoryCard key={cat.id} category={cat} size="default" />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-[#F2EFE9]" data-testid="featured-products">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <span className="text-xs tracking-[0.2em] uppercase font-bold text-[#57534E] mb-2 block">
                Handpicked
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl font-medium text-[#1C1917] tracking-tight">
                Featured Products
              </h2>
            </div>
            <Link 
              to="/shop?featured=true" 
              className="btn-outline hidden sm:inline-flex items-center gap-2"
              data-testid="view-all-featured"
            >
              View All
              <ArrowRight size={18} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton aspect-[3/4] rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {featuredProducts.map((product, i) => (
                <div key={product.id} className={`animate-fade-in stagger-${i + 1}`}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}

          <div className="mt-12 text-center sm:hidden">
            <Link to="/shop" className="btn-primary inline-flex items-center gap-2">
              Browse All Products
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-medium text-[#1C1917] tracking-tight mb-6">
            Ready to discover quality products?
          </h2>
          <p className="text-lg text-[#57534E] mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust Launch Local for their everyday essentials and special finds.
          </p>
          <Link 
            to="/shop" 
            className="btn-primary inline-flex items-center gap-2"
            data-testid="cta-shop-now"
          >
            Start Shopping
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
}
