import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { toast } from 'sonner';

export function ProductCard({ product }) {
  const { addToCart } = useCart();

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <Link 
      to={`/product/${product.id}`}
      className="product-card group block bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
      data-testid={`product-card-${product.id}`}
    >
      <div className="relative aspect-square overflow-hidden bg-[#F2EFE9]">
        <img 
          src={product.image_url} 
          alt={product.name}
          className="product-image w-full h-full object-cover"
        />
        {product.featured && (
          <span className="absolute top-3 left-3 badge-featured">
            Featured
          </span>
        )}
        {product.stock < 10 && product.stock > 0 && (
          <span className="absolute top-3 right-3 badge-low-stock">
            Low Stock
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute top-3 right-3 badge-out-of-stock">
            Out of Stock
          </span>
        )}
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="absolute bottom-3 right-3 p-3 bg-[#4A5D4E] text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 hover:bg-[#3A4A3E] disabled:bg-stone-400 disabled:cursor-not-allowed"
          data-testid={`add-to-cart-${product.id}`}
        >
          <ShoppingBag size={20} />
        </button>
      </div>
      <div className="p-4">
        <p className="text-xs text-[#57534E] uppercase tracking-wider mb-1">
          {product.category.replace('-', ' ')}
        </p>
        <h3 className="font-heading font-medium text-[#1C1917] mb-2 line-clamp-2">
          {product.name}
        </h3>
        <p className="text-lg font-bold text-[#4A5D4E]">
          ${product.price.toFixed(2)}
        </p>
      </div>
    </Link>
  );
}
