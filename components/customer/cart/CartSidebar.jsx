// components/customer/cart/CartSidebar.jsx - NO TOAST VERSION
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Plus, Minus, Trash2, ShoppingBag, LogIn } from 'lucide-react';
import LoginModal from '@/components/auth/LoginModal';

export default function CartSidebar({
  isOpen,
  onClose,
  cart = [],
  onUpdateQuantity,
  onRemoveItem,
  restaurant   
}) {
  // 🔐 Self-managed authentication state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  const router = useRouter();

  // 📡 Check authentication status when component mounts or opens
  useEffect(() => {
    if (isOpen) {
      checkAuthStatus();
    }
  }, [isOpen]);

  const checkAuthStatus = async () => {
    setAuthLoading(true);
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        console.log('🔐 CART: User authenticated:', data.user.name);
        setUser(data.user);
      } else {
        console.log('🔐 CART: User not authenticated');
        setUser(null);
      }
    } catch (error) {
      console.log('🔐 CART: Auth check failed:', error);
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  // 🎯 Handle checkout with self-contained logic (NO TOAST)
  // In CartSidebar.jsx - Updated handleCheckout function
const handleCheckout = async () => {
  console.log('🚀 CART: Checkout initiated');
  console.log('👤 CART: Current user:', user);
  
  if (authLoading) {
    console.log('⏳ CART: Still checking authentication...');
    return;
  }

  if (!user) {
    console.log('❌ CART: User not logged in, showing login modal');
    console.log('🔑 CART: Opening login modal...');
    setShowLoginModal(true);
    return;
  }

  console.log('✅ CART: User authenticated, checking profile completion...');
  
  try {
    // Check profile completion status
    const profileResponse = await fetch('/api/profile/me');
    const profileData = await profileResponse.json();
    
    if (!profileResponse.ok || !profileData.success) {
      console.error('❌ CART: Failed to fetch profile data');
      throw new Error('Failed to fetch profile information');
    }

    console.log('📊 CART: Profile data received:', profileData.completion);
    
    const { completion } = profileData;
    
    // Prepare checkout data to store
    const checkoutData = {
      items: cart,
      subtotal: getTotalAmount(),
      taxes: Math.round(getTotalAmount() * 0.05),
      total: getTotalAmount() + Math.round(getTotalAmount() * 0.05),
      restaurant,
      timestamp: Date.now()
    };

    // Store checkout data for the next step
    localStorage.setItem('checkoutData', JSON.stringify(checkoutData));
    console.log('💾 CART: Checkout data stored in localStorage');

    // Route based on profile completion status
    if (!completion.personalInfo) {
      console.log('📝 CART: Personal info incomplete, redirecting to complete profile');
      router.push('/dashboard/customer/complete-profile');
    } else if (!completion.addressInfo) {
      console.log('📍 CART: Address info incomplete, redirecting to add address');
      router.push('/dashboard/customer/add-address');
    } else if (completion.isComplete) {
      console.log('✅ CART: Profile complete, redirecting to address selection');
      router.push('/dashboard/customer/select-address');
    } else {
      console.log('🔄 CART: Unknown completion state, redirecting to complete profile');
      router.push('/dashboard/customer/complete-profile');
    }
    
    // Close cart after successful routing
    onClose();

  } catch (error) {
    console.error('❌ CART: Error during checkout process:', error);
    
    // Show user-friendly error message
    alert('Something went wrong while processing your request. Please try again.');
    
    // Optional: Still close cart and redirect to a safe page
    onClose();
  }
};


  // 🔑 Handle successful login (NO TOAST)
  const handleLoginSuccess = (userData) => {
    console.log('✅ CART: Login successful:', userData.name);
    setUser(userData);
    setShowLoginModal(false);
    
    // Automatically proceed to checkout after login
    setTimeout(() => {
      console.log('🎯 CART: Auto-proceeding to checkout after login');
      handleCheckout();
    }, 500);
  };

  // 📊 Calculate totals
  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-bold text-gray-900">
              Your Order ({getTotalItems()} items)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Restaurant Info */}
        {restaurant && (
          <div className="flex-shrink-0 p-4 bg-orange-50 border-b border-orange-100">
            <div className="flex items-center gap-3">
              <img
                src={restaurant.imageUrl || '/default-restaurant.jpg'}
                alt={restaurant.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div>
                <h3 className="font-semibold text-gray-900">{restaurant.name}</h3>
                <p className="text-sm text-gray-600">{restaurant.address}</p>
              </div>
            </div>
          </div>
        )}

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <ShoppingBag className="w-16 h-16 mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
              <p className="text-center text-gray-600 font-medium">
                Browse restaurants and add items to get started!
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <img
                  src={item.image || '/default-food.jpg'}
                  alt={item.name}
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 mb-1 truncate">{item.name}</h4>
                  {item.restaurantName && (
                    <p className="text-xs text-gray-500 mb-1">{item.restaurantName}</p>
                  )}
                  <p className="text-orange-600 font-bold">₹{item.price}</p>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200">
                      <button
                        onClick={() => onUpdateQuantity?.(item.id, item.quantity - 1)}
                        className="p-1.5 hover:bg-gray-100 rounded-l-lg transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5 text-gray-600" />
                      </button>
                      <span className="px-2 py-1 font-semibold text-gray-900 min-w-[1.5rem] text-center text-sm">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity?.(item.id, item.quantity + 1)}
                        className="p-1.5 hover:bg-gray-100 rounded-r-lg transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5 text-gray-600" />
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveItem?.(item.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-gray-900">
                    ₹{item.price * item.quantity}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="flex-shrink-0 border-t border-gray-200 p-4 bg-white">
            {/* Bill Details */}
            <div className="space-y-3 mb-4 bg-gray-50 p-4 rounded-xl">
              <div className="flex justify-between text-gray-700 font-medium">
                <span>Subtotal</span>
                <span className="font-semibold">₹{getTotalAmount()}</span>
              </div>
              <div className="flex justify-between text-gray-700 font-medium">
                <span>Delivery Fee</span>
                <span className="text-green-600 font-bold">FREE</span>
              </div>
              <div className="flex justify-between text-gray-700 font-medium">
                <span>Taxes & Charges</span>
                <span className="font-semibold">₹{Math.round(getTotalAmount() * 0.05)}</span>
              </div>
              <div className="border-t-2 border-gray-300 pt-3 flex justify-between">
                <span className="text-xl font-bold text-gray-900">Total</span>
                <span className="text-xl font-bold text-orange-600">
                  ₹{getTotalAmount() + Math.round(getTotalAmount() * 0.05)}
                </span>
              </div>
            </div>

            {/* Debug Info
            <div className="mb-4 p-2 bg-blue-100 rounded text-xs">
              <p><strong>🔍 Debug:</strong></p>
              <p>Auth Loading: {authLoading ? 'Yes' : 'No'}</p>
              <p>User: {user ? `✅ ${user.name}` : '❌ Not logged in'}</p>
              <p>Login Modal: {showLoginModal ? 'Open' : 'Closed'}</p>
            </div> */}

            {/* 🎯 Checkout Button with Debug */}
            <button
              onClick={() => {
                console.log('🔥 BUTTON CLICKED!');
                console.log('🔥 Auth loading:', authLoading);
                console.log('🔥 User:', user);
                console.log('🔥 About to call handleCheckout...');
                handleCheckout();
              }}
              disabled={authLoading}
              className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-3 shadow-lg disabled:opacity-50"
            >
              {authLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading...</span>
                </>
              ) : user ? (
                <>
                  <span className="font-bold">Proceed to Checkout</span>
                  <span className="bg-orange-700 px-3 py-1 rounded-lg font-bold">
                    ₹{getTotalAmount() + Math.round(getTotalAmount() * 0.05)}
                  </span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span className="font-bold">Sign In to Checkout</span>
                  <span className="bg-orange-700 px-3 py-1 rounded-lg font-bold">
                    ₹{getTotalAmount() + Math.round(getTotalAmount() * 0.05)}
                  </span>
                </>
              )}
            </button>

            {!user && !authLoading && (
              <p className="text-center text-xs text-gray-600 font-medium mt-3">
                Create an account to save your preferences and track orders
              </p>
            )}
          </div>
        )}
      </div>

      {/* 🔑 Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => {
          console.log('🔑 CART: Closing login modal');
          setShowLoginModal(false);
        }}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
}
