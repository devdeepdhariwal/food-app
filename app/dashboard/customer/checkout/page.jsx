// app/checkout/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { 
  MapPin, 
  Phone, 
  Mail, 
  CreditCard, 
  ShoppingBag,
  User,
  Clock,
  ArrowLeft,
  CheckCircle,
  Banknote,
  Edit,
  Plus
} from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  
  // State management
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('razorpay'); // 'razorpay' or 'cod'

  // Check authentication and get checkout data
  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      // Check authentication
      const authResponse = await fetch('/api/auth/me');
      if (authResponse.ok) {
        const userData = await authResponse.json();
        setUser(userData.user);
      } else {
        // Redirect to login if not authenticated
        router.push('/?login=required');
        return;
      }

      // Get checkout data from localStorage
      const checkoutData = localStorage.getItem('checkoutData');
      if (checkoutData) {
        setOrderData(JSON.parse(checkoutData));
      } else {
        router.push('/');
        return;
      }

      // Get selected address from localStorage
      const savedAddress = localStorage.getItem('selectedAddress');
      if (savedAddress) {
        setSelectedAddress(JSON.parse(savedAddress));
      }

      // Fetch all addresses
      const addressResponse = await fetch('/api/profile/addresses');
      const addressData = await addressResponse.json();
      
      if (addressData.success) {
        setAddresses(addressData.addresses);
        
        // If no selected address, use default
        if (!savedAddress && addressData.addresses.length > 0) {
          const defaultAddr = addressData.addresses.find(addr => addr.isDefault) || addressData.addresses[0];
          setSelectedAddress(defaultAddr);
        }
      }

    } catch (error) {
      console.error('Error loading checkout data:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  // Process Razorpay payment
  const processRazorpayPayment = async () => {
    setProcessing(true);

    try {
      if (!selectedAddress) {
        alert('Please select a delivery address');
        setProcessing(false);
        return;
      }

      console.log('🎯 Starting Razorpay payment process...');

      // Create order
      const orderResponse = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: orderData.total,
          currency: 'INR',
          receipt: `order_${Date.now()}`,
          notes: {
            userId: user.id,
            userEmail: user.email,
            items: JSON.stringify(orderData.items),
            address: JSON.stringify(selectedAddress)
          }
        })
      });

      const orderResult = await orderResponse.json();

      if (!orderResult.success) {
        throw new Error(orderResult.error);
      }

      console.log('✅ Razorpay order created:', orderResult.orderId);

      // Configure Razorpay options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderResult.amount,
        currency: orderResult.currency,
        name: 'FoodieHub',
        description: `Order for ${orderData.items.length} items`,
        order_id: orderResult.orderId,
        prefill: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          contact: selectedAddress.phone || user.phone
        },
        theme: {
          color: '#ea580c' // Orange color matching your app
        },
        handler: async function(response) {
          console.log('✅ Payment successful:', response);
          await verifyPayment(response);
        },
        modal: {
          ondismiss: function() {
            console.log('❌ Payment cancelled by user');
            setProcessing(false);
          }
        }
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('❌ Payment processing error:', error);
      alert(`Payment failed: ${error.message}`);
      setProcessing(false);
    }
  };

  // Process COD order
  // In your checkout page - Update processCODOrder function
const processCODOrder = async () => {
  setProcessing(true);

  try {
    if (!selectedAddress) {
      alert('Please select a delivery address');
      setProcessing(false);
      return;
    }

    console.log('🎯 Processing COD order...');
    console.log('🏪 Restaurant data:', orderData.restaurant); // ✅ Log restaurant data

    const orderPayload = {
      items: orderData.items,
      totalAmount: orderData.total,
      paymentMethod: 'cod',
      deliveryAddress: selectedAddress,
      customerDetails: {
        name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.name || 'Customer',
        email: user?.email,
        phone: selectedAddress.phone || user?.phone || ''
      },
      restaurantId: orderData.restaurant?.id || orderData.restaurant?._id, // ✅ Make sure this is correct
      restaurantData: {
        name: orderData.restaurant?.name || 'Restaurant',
        address: orderData.restaurant?.address || 'Restaurant Address'
      }
    };

    console.log('📦 Order payload with restaurant ID:', {
      restaurantId: orderPayload.restaurantId, // ✅ Log restaurant ID being sent
      restaurantName: orderPayload.restaurantData.name
    });

    const response = await fetch('/api/customer/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ COD order created successfully');
      console.log('🏪 Order vendor ID:', result.vendorId); // ✅ Log the vendor ID from response
      
      // Clear checkout data
      localStorage.removeItem('checkoutData');
      localStorage.removeItem('selectedAddress');
      
      // Redirect to success page
      router.push(`/dashboard/customer/order-success?orderId=${result.orderId}&orderNumber=${result.orderNumber}&paymentMethod=cod`);
    } else {
      throw new Error(result.error);
    }

  } catch (error) {
    console.error('❌ COD order error:', error);
    alert(`Order failed: ${error.message}`);
  } finally {
    setProcessing(false);
  }
};


  // Verify Razorpay payment
  const verifyPayment = async (paymentResponse) => {
    try {
      console.log('🔍 Verifying payment...');

      const verifyResponse = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...paymentResponse,
          orderData: {
            ...orderData,
            selectedAddress,
            user
          }
        })
      });

      const verifyResult = await verifyResponse.json();

      if (verifyResult.success) {
        console.log('✅ Payment verified successfully');
        
        // Clear checkout data
        localStorage.removeItem('checkoutData');
        localStorage.removeItem('selectedAddress');
        
        // Redirect to success page
        router.push(`/order-success?paymentId=${verifyResult.paymentId}&paymentMethod=razorpay`);
      } else {
        throw new Error(verifyResult.error);
      }

    } catch (error) {
      console.error('❌ Payment verification error:', error);
      alert(`Payment verification failed: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No order data found</h2>
          <p className="text-gray-600 mb-4">Please add items to cart first</p>
          <button
            onClick={() => router.push('/')}
            className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 font-medium"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Razorpay Script */}
      <Script 
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back</span>
              </button>
              <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
              <div className="w-16"></div> {/* Spacer */}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* User Info */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <User className="w-5 h-5 text-orange-600" />
                  <h2 className="text-lg font-bold text-gray-900">Customer Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.name || ''}
                      disabled
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 font-bold text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 font-bold text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-orange-600" />
                    <h2 className="text-lg font-bold text-gray-900">Delivery Address</h2>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push('/dashboard/customer/select-address')}
                      className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Change
                    </button>
                  </div>
                </div>
                
                {selectedAddress ? (
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <h4 className="font-bold text-gray-900 mb-1">{selectedAddress.label}</h4>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {selectedAddress.addressLine1}
                      {selectedAddress.addressLine2 && `, ${selectedAddress.addressLine2}`}
                      {selectedAddress.landmark && ` (Near ${selectedAddress.landmark})`}
                      <br />
                      {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 mb-4">No delivery address selected</p>
                    <button
                      onClick={() => router.push('/dashboard/customer/select-address')}
                      className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 font-medium"
                    >
                      Select Address
                    </button>
                  </div>
                )}
              </div>

              {/* Payment Method Selection */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                  <CreditCard className="w-5 h-5 text-orange-600" />
                  <h2 className="text-lg font-bold text-gray-900">Payment Method</h2>
                </div>
                
                <div className="space-y-4">
                  <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    paymentMethod === 'razorpay' 
                      ? 'border-orange-500 bg-orange-50' 
                      : 'border-gray-200 hover:border-orange-300'
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="razorpay"
                      checked={paymentMethod === 'razorpay'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-orange-600 w-5 h-5"
                    />
                    <CreditCard className="w-6 h-6 text-gray-600" />
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">Online Payment</p>
                      <p className="text-sm text-gray-600">Pay securely with Razorpay (Cards, UPI, Wallets)</p>
                    </div>
                    {paymentMethod === 'razorpay' && (
                      <CheckCircle className="w-5 h-5 text-orange-600" />
                    )}
                  </label>
                  
                  <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    paymentMethod === 'cod' 
                      ? 'border-orange-500 bg-orange-50' 
                      : 'border-gray-200 hover:border-orange-300'
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-orange-600 w-5 h-5"
                    />
                    <Banknote className="w-6 h-6 text-gray-600" />
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">Cash on Delivery</p>
                      <p className="text-sm text-gray-600">Pay when your order arrives at your doorstep</p>
                    </div>
                    {paymentMethod === 'cod' && (
                      <CheckCircle className="w-5 h-5 text-orange-600" />
                    )}
                  </label>
                </div>
              </div>

              {/* Delivery Time */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <h2 className="text-lg font-bold text-gray-900">Delivery Time</h2>
                </div>
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Standard Delivery</p>
                    <p className="text-sm text-gray-600">30-45 minutes</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                <div className="flex items-center gap-3 mb-6">
                  <ShoppingBag className="w-5 h-5 text-orange-600" />
                  <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>
                </div>

                {/* Restaurant Info */}
                {orderData.restaurant && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-bold text-gray-900">{orderData.restaurant.name}</h4>
                    <p className="text-sm text-gray-600">{orderData.restaurant.address}</p>
                  </div>
                )}

                {/* Items */}
                <div className="space-y-4 mb-6">
                  {orderData.items?.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <img
                        src={item.image || '/default-food.jpg'}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-bold text-gray-900">₹{item.price * item.quantity}</p>
                    </div>
                  ))}
                </div>

                {/* Bill Details */}
                <div className="space-y-3 pt-6 border-t border-gray-200">
                  <div className="flex justify-between text-gray-700">
                    <span className="font-medium">Subtotal</span>
                    <span className="font-bold">₹{orderData.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span className="font-medium">Delivery Fee</span>
                    <span className="text-green-600 font-bold">FREE</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span className="font-medium">Taxes & Charges</span>
                    <span className="font-bold">₹{orderData.taxes}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t border-gray-200">
                    <span>Total</span>
                    <span className="text-orange-600">₹{orderData.total}</span>
                  </div>
                </div>

                {/* Payment Button */}
                <button
                  onClick={paymentMethod === 'cod' ? processCODOrder : processRazorpayPayment}
                  disabled={processing || !selectedAddress}
                  className="w-full mt-6 bg-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                  ) : paymentMethod === 'cod' ? (
                    <>
                      <Banknote className="w-5 h-5" />
                      <span>Place Order (COD) - ₹{orderData.total}</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      <span>Pay ₹{orderData.total}</span>
                    </>
                  )}
                </button>

                <p className="text-xs text-center text-gray-500 mt-3">
                  {paymentMethod === 'cod' 
                    ? 'No payment required now. Pay when order arrives.'
                    : 'Secure payment powered by Razorpay'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
