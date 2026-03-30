import { Link } from 'react-router-dom';
import { ShoppingBag, Menu, X, User } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Button } from './ui/button';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { getCartCount, cartItems, getCartTotal, removeFromCart, updateQuantity } = useCart();
  const { user, logout } = useAuth();
  const cartCount = getCartCount();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/shop', label: 'Shop' },
    { href: '/categories', label: 'Categories' },
  ];

  return (
    <header className="glass-header bg-[#FAF9F6]/80 border-b border-stone-200 sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3" data-testid="nav-logo">
            <img 
              src="https://static.prod-images.emergentagent.com/jobs/6c023cc2-2fc0-43fb-8359-ba7aa5d1b242/images/0daed73c7d3787c0323a12e73246227c1c8fc001f61e751969b9ca055bd6c5ae.png" 
              alt="Launch Local" 
              className="h-10 w-10 object-contain"
            />
            <span className="font-heading text-xl font-bold text-[#1C1917] hidden sm:block">
              Launch Local
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className="text-[#57534E] hover:text-[#1C1917] font-medium transition-colors"
                data-testid={`nav-${link.label.toLowerCase()}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            {/* Admin/User Link */}
            {user ? (
              <div className="hidden md:flex items-center gap-4">
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="text-[#4A5D4E] hover:text-[#3A4A3E] font-medium transition-colors"
                    data-testid="nav-admin"
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="text-[#57534E] hover:text-[#1C1917] font-medium transition-colors"
                  data-testid="nav-logout"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden md:flex items-center gap-2 text-[#57534E] hover:text-[#1C1917] font-medium transition-colors"
                data-testid="nav-login"
              >
                <User size={20} />
                <span>Login</span>
              </Link>
            )}

            {/* Cart Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <button 
                  className="relative p-2 text-[#57534E] hover:text-[#1C1917] transition-colors"
                  data-testid="cart-button"
                >
                  <ShoppingBag size={24} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#4A5D4E] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                      {cartCount}
                    </span>
                  )}
                </button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md bg-white">
                <SheetHeader>
                  <SheetTitle className="font-heading text-2xl">Your Cart</SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col h-[calc(100vh-180px)]">
                  {cartItems.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-[#57534E]">
                      <ShoppingBag size={48} className="mb-4 opacity-50" />
                      <p>Your cart is empty</p>
                      <Link to="/shop" className="mt-4 btn-primary" data-testid="continue-shopping">
                        Continue Shopping
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 overflow-auto space-y-4">
                        {cartItems.map(item => (
                          <div 
                            key={item.product.id} 
                            className="flex gap-4 p-4 bg-[#F2EFE9] rounded-xl"
                            data-testid={`cart-item-${item.product.id}`}
                          >
                            <img 
                              src={item.product.image_url} 
                              alt={item.product.name}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                              <h4 className="font-medium text-[#1C1917]">{item.product.name}</h4>
                              <p className="text-[#4A5D4E] font-bold">${item.product.price.toFixed(2)}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <button
                                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                  className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center hover:bg-stone-100"
                                  data-testid={`cart-decrease-${item.product.id}`}
                                >
                                  -
                                </button>
                                <span className="w-8 text-center">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                  className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center hover:bg-stone-100"
                                  data-testid={`cart-increase-${item.product.id}`}
                                >
                                  +
                                </button>
                                <button
                                  onClick={() => removeFromCart(item.product.id)}
                                  className="ml-auto text-[#991B1B] text-sm hover:underline"
                                  data-testid={`cart-remove-${item.product.id}`}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-stone-200 pt-4 mt-4">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-lg font-medium">Total</span>
                          <span className="text-2xl font-bold text-[#4A5D4E]" data-testid="cart-total">
                            ${getCartTotal().toFixed(2)}
                          </span>
                        </div>
                        <Link to="/checkout" className="w-full block">
                          <Button className="w-full btn-primary" data-testid="checkout-button">
                            Proceed to Checkout
                          </Button>
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#57534E] hover:text-[#1C1917]"
              data-testid="mobile-menu-toggle"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-stone-200 animate-fade-in">
            <div className="flex flex-col gap-4">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-[#57534E] hover:text-[#1C1917] font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {user ? (
                <>
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="text-[#4A5D4E] font-medium py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="text-[#57534E] font-medium py-2 text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="text-[#4A5D4E] font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
