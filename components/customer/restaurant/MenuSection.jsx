// components/customer/restaurant/MenuSection.jsx
'use client';

import React, { useRef } from 'react';
import DishCard from './DishCard';

export default function MenuSection({ 
  menuItems, 
  categories, 
  selectedCategory, 
  onCategorySelect, 
  searchQuery, 
  onSearchChange, 
  loading, 
  onAddToCart,
  cart 
}) {
  const scrollRef = useRef(null);

  const scrollLeft = () => {
    scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
  };

  const getItemQuantityInCart = (itemId) => {
    const cartItem = cart.find(item => item.menuItemId === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  const groupedMenuItems = menuItems.reduce((acc, item) => {
    const category = item.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  if (loading) {
    return <MenuSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Category Navigation */}
      {categories.length > 1 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="relative">
            <button
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div
              ref={scrollRef}
              className="flex gap-2 overflow-x-auto scrollbar-hide px-8"
            >
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => onCategorySelect(category)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category === 'all' ? 'All Items' : category}
                </button>
              ))}
            </div>

            <button
              onClick={scrollRight}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Menu Items */}
      {selectedCategory === 'all' ? (
        // Show all categories grouped
        Object.entries(groupedMenuItems).map(([category, items]) => (
          <div key={category} className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 capitalize">
              {category}
            </h3>
            <div className="grid gap-4">
              {items.map((item) => (
                <DishCard
                  key={item._id}
                  dish={item}
                  onAddToCart={onAddToCart}
                  quantityInCart={getItemQuantityInCart(item._id)}
                />
              ))}
            </div>
          </div>
        ))
      ) : (
        // Show selected category only
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900 capitalize">
            {selectedCategory}
          </h3>
          <div className="grid gap-4">
            {menuItems.map((item) => (
              <DishCard
                key={item._id}
                dish={item}
                onAddToCart={onAddToCart}
                quantityInCart={getItemQuantityInCart(item._id)}
              />
            ))}
          </div>
        </div>
      )}

      {menuItems.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
          <p className="text-gray-500">Try searching for something else or browse different categories.</p>
        </div>
      )}

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

// Skeleton loader for menu
function MenuSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="h-10 bg-gray-200 rounded-lg animate-pulse max-w-md"></div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 rounded-full animate-pulse w-20"></div>
          ))}
        </div>
      </div>
      
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex gap-4">
              <div className="w-24 h-24 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-full"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
