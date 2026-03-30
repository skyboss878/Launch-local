import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Search, Filter, X } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../components/ui/sheet';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  const selectedCategory = searchParams.get('category') || '';
  const showFeatured = searchParams.get('featured') === 'true';
  const sortBy = searchParams.get('sort') || 'default';

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API}/categories`);
        setCategories(res.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedCategory) params.set('category', selectedCategory);
        if (showFeatured) params.set('featured', 'true');
        if (searchQuery) params.set('search', searchQuery);

        const res = await axios.get(`${API}/products?${params.toString()}`);
        let sortedProducts = [...res.data];

        // Sort products
        switch (sortBy) {
          case 'price-asc':
            sortedProducts.sort((a, b) => a.price - b.price);
            break;
          case 'price-desc':
            sortedProducts.sort((a, b) => b.price - a.price);
            break;
          case 'name':
            sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
          default:
            // Keep original order (featured first)
            sortedProducts.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        }

        setProducts(sortedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [selectedCategory, showFeatured, searchQuery, sortBy]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchQuery) {
      params.set('search', searchQuery);
    } else {
      params.delete('search');
    }
    setSearchParams(params);
  };

  const handleCategoryChange = (category) => {
    const params = new URLSearchParams(searchParams);
    if (category === selectedCategory) {
      params.delete('category');
    } else {
      params.set('category', category);
    }
    setSearchParams(params);
  };

  const handleSortChange = (value) => {
    const params = new URLSearchParams(searchParams);
    if (value === 'default') {
      params.delete('sort');
    } else {
      params.set('sort', value);
    }
    setSearchParams(params);
  };

  const handleFeaturedToggle = () => {
    const params = new URLSearchParams(searchParams);
    if (showFeatured) {
      params.delete('featured');
    } else {
      params.set('featured', 'true');
    }
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams({});
    setSearchQuery('');
  };

  const hasActiveFilters = selectedCategory || showFeatured || searchQuery;

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Header */}
      <div className="bg-[#1C1917] text-white py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-heading text-4xl sm:text-5xl font-medium tracking-tight mb-4">
            Shop All Products
          </h1>
          <p className="text-stone-400 max-w-xl">
            Explore our curated collection of quality products from trusted brands and local artisans.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#57534E]" size={20} />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-stone-200 rounded-full"
                data-testid="search-input"
              />
            </div>
            <Button type="submit" className="btn-primary" data-testid="search-button">
              Search
            </Button>
          </form>

          {/* Sort */}
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px] bg-white border-stone-200 rounded-full" data-testid="sort-select">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Featured</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
            </SelectContent>
          </Select>

          {/* Mobile Filter */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="sm:hidden rounded-full" data-testid="mobile-filter-button">
                <Filter size={20} />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-white">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div>
                  <h4 className="font-medium mb-3">Categories</h4>
                  <div className="space-y-2">
                    {categories.map(cat => (
                      <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={selectedCategory === cat.id}
                          onCheckedChange={() => handleCategoryChange(cat.id)}
                        />
                        <span className="text-sm">{cat.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={showFeatured}
                      onCheckedChange={handleFeaturedToggle}
                    />
                    <span className="text-sm">Featured Only</span>
                  </label>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="bg-white border border-stone-200 rounded-2xl p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-heading font-bold text-lg">Filters</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-[#4A5D4E] hover:underline"
                    data-testid="clear-filters"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h4 className="font-medium mb-3 text-[#1C1917]">Categories</h4>
                <div className="space-y-2">
                  {categories.map(cat => (
                    <label 
                      key={cat.id} 
                      className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-[#F2EFE9] transition-colors"
                    >
                      <Checkbox
                        checked={selectedCategory === cat.id}
                        onCheckedChange={() => handleCategoryChange(cat.id)}
                        data-testid={`filter-category-${cat.id}`}
                      />
                      <span className="text-sm text-[#57534E]">{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Featured Toggle */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-[#F2EFE9] transition-colors">
                  <Checkbox
                    checked={showFeatured}
                    onCheckedChange={handleFeaturedToggle}
                    data-testid="filter-featured"
                  />
                  <span className="text-sm text-[#57534E]">Featured Only</span>
                </label>
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedCategory && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#4A5D4E]/10 text-[#4A5D4E] rounded-full text-sm">
                    {categories.find(c => c.id === selectedCategory)?.name}
                    <button onClick={() => handleCategoryChange(selectedCategory)}>
                      <X size={14} />
                    </button>
                  </span>
                )}
                {showFeatured && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#4A5D4E]/10 text-[#4A5D4E] rounded-full text-sm">
                    Featured
                    <button onClick={handleFeaturedToggle}>
                      <X size={14} />
                    </button>
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#4A5D4E]/10 text-[#4A5D4E] rounded-full text-sm">
                    "{searchQuery}"
                    <button onClick={() => { setSearchQuery(''); clearFilters(); }}>
                      <X size={14} />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Results count */}
            <p className="text-[#57534E] mb-6" data-testid="product-count">
              {loading ? 'Loading...' : `${products.length} products`}
            </p>

            {/* Products */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="skeleton aspect-[3/4] rounded-2xl" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-[#57534E] mb-4">No products found</p>
                <Button onClick={clearFilters} className="btn-outline">
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6" data-testid="product-grid">
                {products.map((product, i) => (
                  <div key={product.id} className={`animate-fade-in stagger-${(i % 6) + 1}`}>
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
