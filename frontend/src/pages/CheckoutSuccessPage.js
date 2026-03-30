import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [paymentData, setPaymentData] = useState(null);
  const { clearCart } = useCart();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const pollPaymentStatus = async (attempts = 0) => {
      const maxAttempts = 5;
      const pollInterval = 2000;

      if (!sessionId) {
        setStatus('error');
        return;
      }

      if (attempts >= maxAttempts) {
        setStatus('timeout');
        return;
      }

      try {
        const response = await axios.get(`${API}/checkout/status/${sessionId}`);
        setPaymentData(response.data);

        if (response.data.payment_status === 'paid') {
          setStatus('success');
          clearCart();
          return;
        } else if (response.data.status === 'expired') {
          setStatus('expired');
          return;
        }

        // Continue polling
        setTimeout(() => pollPaymentStatus(attempts + 1), pollInterval);
      } catch (error) {
        console.error('Error checking payment status:', error);
        if (attempts < maxAttempts - 1) {
          setTimeout(() => pollPaymentStatus(attempts + 1), pollInterval);
        } else {
          setStatus('error');
        }
      }
    };

    pollPaymentStatus();
  }, [sessionId, clearCart]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin mx-auto text-[#4A5D4E] mb-4" />
          <h2 className="font-heading text-2xl font-bold text-[#1C1917] mb-2">
            Processing your payment...
          </h2>
          <p className="text-[#57534E]">Please wait while we confirm your order.</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center px-4">
        <div className="text-center max-w-md" data-testid="checkout-success">
          <div className="w-20 h-20 bg-[#166534]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={48} className="text-[#166534]" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-[#1C1917] mb-4">
            Thank you for your order!
          </h1>
          <p className="text-[#57534E] mb-8">
            Your payment was successful. We've received your order and will begin processing it right away.
          </p>
          {paymentData && (
            <div className="bg-white border border-stone-200 rounded-2xl p-6 mb-8 text-left">
              <h3 className="font-medium mb-4">Order Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#57534E]">Amount Paid</span>
                  <span className="font-medium">${(paymentData.amount_total / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#57534E]">Payment Status</span>
                  <span className="font-medium text-[#166534] capitalize">{paymentData.payment_status}</span>
                </div>
              </div>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/shop" className="btn-primary" data-testid="continue-shopping">
              Continue Shopping
            </Link>
            <Link to="/" className="btn-outline">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="font-heading text-2xl font-bold text-[#1C1917] mb-4">
          {status === 'expired' ? 'Session Expired' : 'Something went wrong'}
        </h1>
        <p className="text-[#57534E] mb-8">
          {status === 'expired' 
            ? 'Your payment session has expired. Please try again.' 
            : 'We couldn\'t verify your payment. Please contact support if you were charged.'}
        </p>
        <Link to="/checkout" className="btn-primary">
          Try Again
        </Link>
      </div>
    </div>
  );
}
