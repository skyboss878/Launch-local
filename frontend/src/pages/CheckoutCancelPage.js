import { Link } from 'react-router-dom';
import { XCircle } from 'lucide-react';

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center px-4">
      <div className="text-center max-w-md" data-testid="checkout-cancel">
        <div className="w-20 h-20 bg-[#991B1B]/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle size={48} className="text-[#991B1B]" />
        </div>
        <h1 className="font-heading text-3xl font-bold text-[#1C1917] mb-4">
          Payment Cancelled
        </h1>
        <p className="text-[#57534E] mb-8">
          Your payment was cancelled. Your cart items are still saved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/checkout" className="btn-primary" data-testid="try-again">
            Try Again
          </Link>
          <Link to="/shop" className="btn-outline">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
