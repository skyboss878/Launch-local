import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, ShoppingBag, CreditCard, Lock } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CheckoutPage() {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCheckout = async (e) => {
    e.preventDefault();
    
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API}/checkout/create-session`, {
        origin_url: window.location.origin,
        cart_items: cartItems.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity
        })),
        customer_email: email || null
      });

      // Redirect to Stripe checkout
      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to create checkout session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center px-4">
        <div className="text-center">
          <ShoppingBag size={64} className="mx-auto text-[#57534E] mb-4" />
          <h2 className="font-heading text-2xl font-bold text-[#1C1917] mb-2">Your cart is empty</h2>
          <p className="text-[#57534E] mb-6">Add some products to get started</p>
          <Link to="/shop" className="btn-primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <Link 
          to="/shop" 
          className="inline-flex items-center gap-2 text-[#57534E] hover:text-[#1C1917] mb-8 transition-colors"
          data-testid="back-to-shop"
        >
          <ArrowLeft size={20} />
          Continue Shopping
        </Link>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Checkout Form */}
          <div>
            <h1 className="font-heading text-3xl font-bold text-[#1C1917] mb-8">Checkout</h1>

            <form onSubmit={handleCheckout} className="space-y-6" data-testid="checkout-form">
              <div className="bg-white border border-stone-200 rounded-2xl p-6">
                <h2 className="font-heading text-lg font-bold mb-4 flex items-center gap-2">
                  <CreditCard size={20} className="text-[#4A5D4E]" />
                  Contact Information
                </h2>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="rounded-xl"
                      data-testid="checkout-email"
                    />
                    <p className="text-xs text-[#57534E]">For order confirmation and updates</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#4A5D4E]/5 border border-[#4A5D4E]/20 rounded-2xl p-6">
                <div className="flex items-start gap-3">
                  <Lock size={20} className="text-[#4A5D4E] mt-0.5" />
                  <div>
                    <h3 className="font-medium text-[#1C1917]">Secure Payment</h3>
                    <p className="text-sm text-[#57534E]">
                      You'll be redirected to Stripe's secure checkout to complete your payment.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full btn-primary text-lg py-4"
                disabled={loading}
                data-testid="proceed-to-payment"
              >
                {loading ? 'Processing...' : `Pay $${getCartTotal().toFixed(2)}`}
              </Button>
            </form>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white border border-stone-200 rounded-2xl p-6 sticky top-24">
              <h2 className="font-heading text-lg font-bold mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                {cartItems.map(item => (
                  <div 
                    key={item.product.id} 
                    className="flex gap-4"
                    data-testid={`checkout-item-${item.product.id}`}
                  >
                    <img 
                      src={item.product.image_url} 
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-[#1C1917] truncate">{item.product.name}</h4>
                      <p className="text-sm text-[#57534E]">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium text-[#1C1917]">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-stone-200 pt-4 space-y-2">
                <div className="flex justify-between text-[#57534E]">
                  <span>Subtotal</span>
                  <span>${getCartTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#57534E]">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-[#1C1917] pt-2 border-t border-stone-200">
                  <span>Total</span>
                  <span data-testid="checkout-total">${getCartTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
