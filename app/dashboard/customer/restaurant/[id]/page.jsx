// app/dashboard/customer/restaurant/[id]/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Clock, Star, MapPin, Plus, Minus, Timer, Search } from 'lucide-react';
import CartSidebar from '@/components/customer/cart/CartSidebar';

export default function RestaurantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    fetchRestaurantDetails();
    fetchMenuItems();
  }, [params.id]);

  const fetchRestaurantDetails = async () => {
    try {
      const response = await fetch(`/api/customer/restaurants/${params.id}`);
      const data = await response.json();

      if (data.success) {
        setRestaurant(data.restaurant);
      } else {
        toast.error('Restaurant not found');
        router.push('/dashboard/customer');
      }
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      toast.error('Failed to load restaurant details');
    }
  };

  const fetchMenuItems = async () => {
    setLoading(true);
    try {
      const url = `/api/customer/restaurants/${params.id}/menu`;
      console.log('🔄 Fetching menu from URL:', url);
      console.log('📋 Restaurant ID:', params.id);
      
      const response = await fetch(url);
      console.log('📡 Response status:', response.status);
      
      const data = await response.json();
      console.log('📦 Response data:', data);

      if (data.success) {
        console.log('✅ Menu items received:', data.menuItems.length);
        setMenuItems(data.menuItems);
      } else {
        console.log('❌ API returned success: false');
        console.log('Error message:', data.message);
        toast.error('Failed to load menu');
      }
    } catch (error) {
      console.error('💥 Fetch error:', error);
      toast.error('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Cart addition function with proper variable naming
  const addToCart = (item, customizations = {}) => {
    const newCartItem = {
      id: `${item._id}_${JSON.stringify(customizations)}`,
      menuItemId: item._id,
      name: item.name,
      price: item.price,
      image: item.image,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      customizations,
      quantity: 1
    };

    setCart(prev => {
      const existingCartItem = prev.find(existingItem => existingItem.id === newCartItem.id);
      
      if (existingCartItem) {
        // If item already exists, increment quantity
        return prev.map(existingItem =>
          existingItem.id === newCartItem.id
            ? { ...existingItem, quantity: existingItem.quantity + 1 }
            : existingItem
        );
      } else {
        // If new item, add to cart
        return [...prev, newCartItem];
      }
    });

    toast.success('Added to cart!');
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
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

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // FIXED: Get quantity function to properly find cart items
  const getItemQuantity = (itemId) => {
    const cartItem = cart.find(item => item.menuItemId === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  // FIXED: Helper function to get cart item by menu item ID
  const getCartItemByMenuId = (menuItemId) => {
    return cart.find(item => item.menuItemId === menuItemId);
  };

  const getFilteredItems = () => {
    let filtered = menuItems;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => 
        item.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const getCategories = () => {
    const categories = ['all', ...new Set(menuItems.map(item => item.category))];
    return categories;
  };

  const truncateText = (text, maxLength) => {
    if (!text) return 'Delicious food item';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (!restaurant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const filteredItems = getFilteredItems();
  const categories = getCategories();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to restaurants
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Restaurant Info */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <img
              src={restaurant.imageUrl || '/default-restaurant.jpg'}
              alt={restaurant.name}
              className="w-full md:w-48 h-48 object-cover rounded-lg"
            />
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{restaurant.name}</h1>
              <p className="text-gray-600 mb-3">{restaurant.cuisines?.join(', ') || 'Multi-Cuisine'}</p>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{restaurant.rating}</span>
                  <span>({restaurant.totalReviews} reviews)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{restaurant.deliveryTime}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>Nearby</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                  Free delivery
                </span>
                <span className="text-gray-600">Minimum order ₹{restaurant.minimumOrder}</span>
              </div>

              <div className="mt-4 text-sm text-gray-600">
                <p className="font-medium">Hours: {restaurant.operatingHours}</p>
                <p>{restaurant.address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Categories */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search for dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 font-semibold placeholder-gray-500"
              />
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category === 'all' ? 'All Items' : category}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {selectedCategory === 'all' ? 'All Items' : selectedCategory} ({filteredItems.length} items)
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse w-72 h-80 mx-auto">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 place-items-center">
              {filteredItems.map((item) => (
                <div
                  key={item._id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 group w-72 h-80 flex flex-col relative"
                >
                  {/* Food Image with Overlay - 60% height */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={item.image || '/default-food.jpg'}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    {/* Veg/Non-Veg Indicator */}
                    <div className="absolute top-3 left-3">
                      <div className={`w-5 h-5 border-2 flex items-center justify-center rounded ${
                        item.isVeg 
                          ? 'border-green-600 bg-white' 
                          : 'border-red-600 bg-white'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          item.isVeg ? 'bg-green-600' : 'bg-red-600'
                        }`} />
                      </div>
                    </div>

                    {/* Category Tag */}
                    <div className="absolute top-3 right-3">
                      <div className="text-xs text-white bg-orange-600 px-3 py-1 rounded-full font-medium shadow-lg">
                        {item.category}
                      </div>
                    </div>

                    {/* Preparation Time Badge */}
                    <div className="absolute bottom-3 left-3">
                      <div className="flex items-center text-xs text-white bg-black/70 px-2 py-1 rounded-full">
                        <Timer className="w-3 h-3 mr-1" />
                        <span>{item.preparationTime}m</span>
                      </div>
                    </div>

                    {/* FIXED: Quick Add/Remove Controls */}
                    {getItemQuantity(item._id) === 0 ? (
                      <button
                        onClick={() => addToCart(item)}
                        className="absolute bottom-3 right-3 w-10 h-10 bg-orange-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-orange-700 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    ) : (
                      <div className="absolute bottom-3 right-3 bg-white rounded-full shadow-lg px-3 py-1 flex items-center gap-2 opacity-100">
                        <button
                          onClick={() => {
                            const cartItem = getCartItemByMenuId(item._id);
                            if (cartItem) {
                              updateCartItemQuantity(cartItem.id, cartItem.quantity - 1);
                            }
                          }}
                          className="w-7 h-7 flex items-center justify-center text-orange-600 hover:bg-orange-50 rounded-full"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-semibold min-w-[1.5rem] text-center">
                          {getItemQuantity(item._id)}
                        </span>
                        <button
                          onClick={() => addToCart(item)}
                          className="w-7 h-7 flex items-center justify-center text-orange-600 hover:bg-orange-50 rounded-full"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Sliding Description Overlay on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                      <div className="p-4 text-white">
                        <p className="text-sm leading-relaxed">
                          {item.description || 'Delicious and freshly prepared food item made with finest ingredients.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Food Details - 40% height */}
                  <div className="h-32 p-4 flex flex-col justify-between">
                    {/* Name and Price */}
                    <div className="mb-2">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-bold text-gray-900 text-lg leading-tight flex-1 mr-2">
                          {item.name}
                        </h3>
                        <div className="flex flex-col items-end">
                          <span className="text-lg font-bold text-orange-600">
                            ₹{item.price}
                          </span>
                        </div>
                      </div>
                      
                      {/* Short Description - Always Visible */}
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {truncateText(item.description, 45)}
                      </p>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      onClick={() => addToCart(item)}
                      className="w-full py-2.5 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors text-sm"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-500">
                Try searching for something else or browse different categories.
              </p>
            </div>
          )}
        </div>
      </div>

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
        restaurant={restaurant}
      />
    </div>
  );
}
