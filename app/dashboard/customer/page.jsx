// app/dashboard/customer/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import SearchBar from '@/components/customer/dashboard/SearchBar';
import CategoryCarousel from '@/components/customer/dashboard/CategoryCarousel';
import RestaurantGrid from '@/components/customer/dashboard/RestaurantGrid';
import FilterPanel from '@/components/customer/dashboard/FilterPanel';
import CartSidebar from '@/components/customer/cart/CartSidebar';
import { MapPin, Search, X } from 'lucide-react';

export default function CustomerDashboard() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [userPincode, setUserPincode] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showPincodeModal, setShowPincodeModal] = useState(false);
  const [tempPincode, setTempPincode] = useState('');
  const [filters, setFilters] = useState({
    sortBy: 'relevance',
    vegOnly: false,
    minRating: 0,
    maxDeliveryTime: 60,
    freeDelivery: false
  });
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);

  const router = useRouter();

  // Show pincode modal on first visit
  useEffect(() => {
    const savedPincode = localStorage.getItem('userPincode');
    if (savedPincode) {
      setUserPincode(savedPincode);
    } else {
      setTimeout(() => {
        setShowPincodeModal(true);
      }, 500);
    }
  }, []);

  // Fetch restaurants when pincode or filters change
  useEffect(() => {
    fetchRestaurants();
  }, [userPincode, searchQuery, selectedCategory, filters]);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        pincode: userPincode || '',
        search: searchQuery,
        category: selectedCategory,
        sortBy: filters.sortBy,
        vegOnly: filters.vegOnly.toString(),
        minRating: filters.minRating.toString(),
        showOnlyOpen: 'true' // Add this to show restaurant status
      });

      const response = await fetch(`/api/customer/restaurants?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        setRestaurants(data.restaurants);
        
        if (data.restaurants.length === 0 && userPincode) {
          if (selectedCategory !== 'all') {
            toast.error(`No restaurants found serving ${selectedCategory} in ${userPincode}`);
          } else {
            toast.error(`No restaurants found for pincode ${userPincode}. Try expanding your search.`);
          }
        }
      } else {
        toast.error(data.message || 'Failed to fetch restaurants');
        setRestaurants([]);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      toast.error('Failed to load restaurants');
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePincodeSubmit = () => {
    if (tempPincode.trim()) {
      if (!/^\d{6}$/.test(tempPincode.trim())) {
        toast.error('Please enter a valid 6-digit pincode');
        return;
      }
      
      const pincode = tempPincode.trim();
      setUserPincode(pincode);
      localStorage.setItem('userPincode', pincode);
      setShowPincodeModal(false);
      setTempPincode('');
      toast.success(`Searching restaurants in ${pincode}`);
    } else {
      toast.error('Please enter your pincode');
    }
  };

  const changePincode = () => {
    setShowPincodeModal(true);
    setTempPincode(userPincode || '');
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    if (category !== 'all') {
      toast.info(`Showing restaurants with ${category} dishes`);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const addToCart = (item) => {
    setCart(prev => {
      const existingItem = prev.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prev.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prev, { ...item, quantity: 1 }];
      }
    });
    toast.success('Added to cart!');
  };

  const updateCartItemQuantity = (itemId, quantity) => {
    if (quantity === 0) {
      removeFromCart(itemId);
      return;
    }

    setCart(prev => prev.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    ));
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
    toast.success('Removed from cart');
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getDisplayTitle = () => {
    if (selectedCategory !== 'all' && userPincode) {
      return `${selectedCategory} restaurants in ${userPincode}`;
    } else if (selectedCategory !== 'all') {
      return `${selectedCategory} restaurants`;
    } else if (userPincode) {
      return `Restaurants in ${userPincode}`;
    }
    return 'All Restaurants';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            {/* Simple Location Bar */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-500" />
                <span className="text-sm text-gray-600">Delivering to:</span>
                {userPincode ? (
                  <button
                    onClick={changePincode}
                    className="text-sm font-semibold text-gray-900 hover:text-orange-600 underline"
                  >
                    {userPincode}
                  </button>
                ) : (
                  <button
                    onClick={() => setShowPincodeModal(true)}
                    className="text-sm font-semibold text-orange-600 hover:text-orange-700"
                  >
                    Enter Pincode
                  </button>
                )}
              </div>
            </div>

            {/* Simple Search Bar */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search for restaurants, food..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 font-semibold placeholder-gray-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* No Pincode Selected Message */}
        {!userPincode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-blue-700 text-sm">
                  <strong>Enter your pincode</strong> to see restaurants that deliver to your area
                </p>
              </div>
              <button
                onClick={() => setShowPincodeModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Enter Pincode
              </button>
            </div>
          </div>
        )}

        {/* Categories */}
        <CategoryCarousel
          selectedCategory={selectedCategory}
          onCategorySelect={handleCategorySelect}
        />

        {/* Filters Toggle */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {getDisplayTitle()}
            </h1>
            {restaurants.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''} found
                {selectedCategory !== 'all' && (
                  <span className="text-orange-600 font-medium"> serving {selectedCategory}</span>
                )}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 2v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
            {(filters.vegOnly || filters.minRating > 0 || filters.freeDelivery) && (
              <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                Active
              </span>
            )}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <FilterPanel
            filters={filters}
            onFiltersChange={handleFilterChange}
            onClose={() => setShowFilters(false)}
          />
        )}

        {/* Restaurant Grid */}
        <RestaurantGrid
          restaurants={restaurants}
          loading={loading}
          onAddToCart={addToCart}
          selectedCategory={selectedCategory} // Pass selected category
        />
      </div>

      {/* Simple Pincode Modal */}
      {showPincodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-sm mx-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-2">
                <MapPin className="w-6 h-6 text-orange-500" />
                <h2 className="text-lg font-semibold text-gray-900">Enter Pincode</h2>
              </div>
              {userPincode && (
                <button
                  onClick={() => setShowPincodeModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="p-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tempPincode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setTempPincode(value);
                  }}
                  placeholder="Enter pincode"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 font-semibold placeholder-gray-500"
                  maxLength={6}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handlePincodeSubmit();
                    }
                  }}
                />
                <button
                  onClick={handlePincodeSubmit}
                  className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!userPincode && (
              <div className="px-6 pb-6">
                <button
                  onClick={() => {
                    setShowPincodeModal(false);
                    toast.info('You can enter your pincode anytime to see local restaurants');
                  }}
                  className="w-full py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Skip for now
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-6 right-6 bg-orange-500 text-white px-6 py-3 rounded-full shadow-lg hover:bg-orange-600 transition-colors flex items-center gap-2 z-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h8m-8 0a2 2 0 104 0 2 2 0 00-4 0zm8 0a2 2 0 104 0 2 2 0 00-4 0z" />
          </svg>
          <span>{getTotalItems()} items</span>
          <span>₹{getTotalAmount()}</span>
        </button>
      )}

      {/* Cart Sidebar */}
      <CartSidebar
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        cart={cart}
        onUpdateQuantity={updateCartItemQuantity}
        onRemoveItem={removeFromCart}
        restaurant={restaurants.find(r => cart.some(item => item.restaurantId === r.id))}
      />
    </div>
  );
}
