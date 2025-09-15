'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  CheckCircle, 
  Home, 
  ShoppingBag, 
  Clock, 
  Package,
  CreditCard,
  Banknote,
  Star,
  RefreshCw
} from 'lucide-react';

export default function OrderDetails() {
  const searchParams = useSearchParams();

  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  const orderId = searchParams.get('orderId');
  const orderNumber = searchParams.get('orderNumber');
  const paymentId = searchParams.get('paymentId');
  const paymentMethod = searchParams.get('paymentMethod');

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    } else {
      setLoading(false);
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setOrderDetails({
        orderId,
        orderNumber,
        paymentId,
        paymentMethod,
        estimatedDelivery: '30-45 minutes'
      });
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodDisplay = () => {
    switch (paymentMethod) {
      case 'razorpay':
        return {
          icon: <CreditCard className="w-5 h-5" />,
          text: 'Online Payment',
          status: 'Payment Successful'
        };
      case 'cod':
        return {
          icon: <Banknote className="w-5 h-5" />,
          text: 'Cash on Delivery',
          status: 'Pay on Delivery'
        };
      default:
        return {
          icon: <CreditCard className="w-5 h-5" />,
          text: 'Payment',
          status: 'Completed'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p>No order details found.</p></div>;
  }

  const paymentDisplay = getPaymentMethodDisplay();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Success Header */}
        <div className="bg-white rounded-xl shadow-sm p-8 text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-lg text-gray-600 mb-6">
            {paymentMethod === 'cod' 
              ? 'Your order has been placed successfully'
              : 'Thank you for your payment. Your order has been confirmed!'
            }
          </p>

          {/* Order Number */}
          {orderNumber && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-orange-700 font-medium">Order Number</p>
              <p className="text-xl font-bold text-orange-800">#{orderNumber}</p>
            </div>
          )}

          {/* Payment Info */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex items-center gap-2 text-gray-700">
              {paymentDisplay.icon}
              <span className="font-medium">{paymentDisplay.text}</span>
            </div>
            <span className="text-gray-400">•</span>
            <span className={`font-medium ${
              paymentMethod === 'cod' ? 'text-blue-600' : 'text-green-600'
            }`}>
              {paymentDisplay.status}
            </span>
          </div>

          {/* Payment ID for online payments */}
          {paymentId && (
            <div className="text-sm text-gray-500 mb-6">
              Payment ID: <span className="font-mono">{paymentId}</span>
            </div>
          )}
        </div>

        {/* Order Status */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-600" />
            Order Status
          </h2>

          <div className="space-y-4">
            {/* Current Status */}
            <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">Order Placed</p>
                <p className="text-sm text-gray-600">
                  {paymentMethod === 'cod' 
                    ? 'Waiting for restaurant confirmation'
                    : 'Payment confirmed, preparing your order'
                  }
                </p>
              </div>
              <div className="text-right text-sm text-gray-500">
                {new Date().toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>

            {/* Next Steps */}
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg opacity-60">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-500">2</span>
                </div>
                <div>
                  <p className="font-medium text-gray-500">Restaurant Preparing</p>
                  <p className="text-sm text-gray-400">We'll notify you when ready</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg opacity-60">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-500">3</span>
                </div>
                <div>
                  <p className="font-medium text-gray-500">Out for Delivery</p>
                  <p className="text-sm text-gray-400">Track your delivery partner</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg opacity-60">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-500">4</span>
                </div>
                <div>
                  <p className="font-medium text-gray-500">Delivered</p>
                  <p className="text-sm text-gray-400">Enjoy your meal!</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Info */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            Delivery Information
          </h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <Clock className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-bold text-gray-900">Estimated Delivery Time</p>
                <p className="text-green-600 font-medium">30-45 minutes</p>
              </div>
            </div>

            <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
              <p className="font-medium text-gray-700 mb-2">What happens next?</p>
              <ul className="space-y-1">
                <li>• Restaurant will confirm and start preparing your order</li>
                <li>• You'll receive SMS updates on your order status</li>
                <li>• Our delivery partner will pick up and deliver to you</li>
                {paymentMethod === 'cod' && (
                  <li><strong>• Please keep ₹{searchParams.get('amount') || 'exact change'} ready for COD</strong></li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => {
                window.location.href = '/dashboard/customer/orders';
              }}
              className="flex items-center justify-center gap-2 bg-orange-600 text-white py-4 rounded-xl hover:bg-orange-700 font-bold text-lg transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              Track Order
            </button>

            <button
              onClick={() => {
                window.location.href = '/';
              }}
              className="flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-700 py-4 rounded-xl hover:bg-gray-50 font-bold text-lg transition-colors"
            >
              <Home className="w-5 h-5" />
              Back to Home
            </button>
          </div>

          {orderNumber && (
            <button
              onClick={() => {
                alert('Reorder functionality will be added soon!');
              }}
              className="w-full flex items-center justify-center gap-2 text-orange-600 py-3 rounded-lg hover:bg-orange-50 font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reorder These Items
            </button>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm mb-2">Need help with your order?</p>
          <div className="flex items-center justify-center gap-4 text-sm">
            <button className="text-orange-600 hover:text-orange-700 font-medium">
              Contact Support
            </button>
            <span className="text-gray-400">•</span>
            <button className="text-orange-600 hover:text-orange-700 font-medium">
              Call Restaurant
            </button>
          </div>
        </div>

        {/* Feedback Prompt */}
        <div className="mt-8 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-6 text-center">
          <Star className="w-8 h-8 text-orange-500 mx-auto mb-3" />
          <h3 className="font-bold text-gray-900 mb-2">How was your experience?</h3>
          <p className="text-sm text-gray-600 mb-4">
            Help us improve by rating your ordering experience
          </p>
          <button className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 font-medium text-sm">
            Rate Experience
          </button>
        </div>
      </div>
    </div>
  );
}
