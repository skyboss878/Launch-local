import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ShoppingBag, Minus, Plus, ArrowLeft, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { ProductCard } from '../components/ProductCard';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ProductPage() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/products/${productId}`);
        setProduct(res.data);

        // Fetch related products from same category
        const relatedRes = await axios.get(`${API}/products?category=${res.data.category}`);
        setRelatedProducts(relatedRes.data.filter(p => p.id !== productId).slice(0, 4));
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    window.scrollTo(0, 0);
  }, [productId]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
      toast.success(`${quantity} x ${product.name} added to cart`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="skeleton w-32 h-6 rounded mb-8" />
          <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
            <div className="skeleton aspect-square rounded-2xl" />
            <div className="space-y-4">
              <div className="skeleton w-24 h-4 rounded" />
              <div className="skeleton w-full h-10 rounded" />
              <div className="skeleton w-32 h-8 rounded" />
              <div className="skeleton w-full h-24 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-heading text-2xl mb-4">Product not found</h2>
          <Link to="/shop" className="btn-primary">
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Breadcrumb */}
        <Link 
          to="/shop" 
          className="inline-flex items-center gap-2 text-[#57534E] hover:text-[#1C1917] mb-8 transition-colors"
          data-testid="back-to-shop"
        >
          <ArrowLeft size={20} />
          Back to Shop
        </Link>

        {/* Product Details */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-16" data-testid="product-details">
          {/* Image */}
          <div className="relative aspect-square bg-[#F2EFE9] rounded-2xl overflow-hidden">
            <img 
              src={product.image_url} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {product.featured && (
              <span className="absolute top-4 left-4 badge-featured">Featured</span>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <span className="text-xs tracking-[0.2em] uppercase font-bold text-[#57534E] mb-2">
              {product.category.replace('-', ' ')}
            </span>
            <h1 className="font-heading text-3xl sm:text-4xl font-medium text-[#1C1917] tracking-tight mb-4" data-testid="product-name">
              {product.name}
            </h1>
            <p className="text-3xl font-bold text-[#4A5D4E] mb-6" data-testid="product-price">
              ${product.price.toFixed(2)}
            </p>

            <p className="text-[#57534E] leading-relaxed mb-8" data-testid="product-description">
              {product.description}
            </p>

            {/* Stock Status */}
            <div className="mb-6">
              {product.stock > 10 ? (
                <span className="inline-flex items-center gap-2 text-[#166534]">
                  <Check size={18} />
                  In Stock
                </span>
              ) : product.stock > 0 ? (
                <span className="text-amber-600">Only {product.stock} left in stock</span>
              ) : (
                <span className="text-[#991B1B]">Out of Stock</span>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-4 mb-8">
              <span className="font-medium text-[#1C1917]">Quantity</span>
              <div className="flex items-center border border-stone-200 rounded-full">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center text-[#57534E] hover:text-[#1C1917] transition-colors"
                  disabled={quantity <= 1}
                  data-testid="decrease-quantity"
                >
                  <Minus size={18} />
                </button>
                <span className="w-12 text-center font-medium" data-testid="quantity-display">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                  className="w-10 h-10 flex items-center justify-center text-[#57534E] hover:text-[#1C1917] transition-colors"
                  disabled={quantity >= product.stock}
                  data-testid="increase-quantity"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {/* Add to Cart */}
            <Button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
              data-testid="add-to-cart-button"
            >
              <ShoppingBag size={20} />
              Add to Cart - ${(product.price * quantity).toFixed(2)}
            </Button>

            {/* Additional Info */}
            <div className="mt-auto pt-8 border-t border-stone-200 mt-8">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[#57534E]">Category</span>
                  <p className="font-medium capitalize">{product.category.replace('-', ' ')}</p>
                </div>
                <div>
                  <span className="text-[#57534E]">SKU</span>
                  <p className="font-medium">{product.id.toUpperCase()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 lg:mt-24" data-testid="related-products">
            <h2 className="font-heading text-2xl sm:text-3xl font-medium text-[#1C1917] mb-8">
              You May Also Like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
