import { Link } from 'react-router-dom';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#1C1917] text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img 
                src="https://static.prod-images.emergentagent.com/jobs/6c023cc2-2fc0-43fb-8359-ba7aa5d1b242/images/0daed73c7d3787c0323a12e73246227c1c8fc001f61e751969b9ca055bd6c5ae.png" 
                alt="Launch Local" 
                className="h-12 w-12 object-contain"
              />
              <span className="font-heading text-2xl font-bold">Launch Local</span>
            </Link>
            <p className="text-stone-400 max-w-md leading-relaxed">
              Your destination for quality products from local artisans and trusted brands. 
              From home essentials to premium fragrances, we bring the best to your doorstep.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-bold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/shop" className="text-stone-400 hover:text-white transition-colors">
                  Shop All
                </Link>
              </li>
              <li>
                <Link to="/categories" className="text-stone-400 hover:text-white transition-colors">
                  Categories
                </Link>
              </li>
              <li>
                <Link to="/shop?featured=true" className="text-stone-400 hover:text-white transition-colors">
                  Featured Items
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-heading font-bold text-lg mb-4">Categories</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/shop?category=home-hardware" className="text-stone-400 hover:text-white transition-colors">
                  Home & Hardware
                </Link>
              </li>
              <li>
                <Link to="/shop?category=fragrances" className="text-stone-400 hover:text-white transition-colors">
                  Fragrances
                </Link>
              </li>
              <li>
                <Link to="/shop?category=candles" className="text-stone-400 hover:text-white transition-colors">
                  Candles
                </Link>
              </li>
              <li>
                <Link to="/shop?category=generators" className="text-stone-400 hover:text-white transition-colors">
                  Generators
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-stone-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-stone-500 text-sm">
            © {currentYear} Launch Local. All rights reserved.
          </p>
          <div className="flex gap-6">
            <span className="text-stone-500 text-sm">Powered by Faire</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
