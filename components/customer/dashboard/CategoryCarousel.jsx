// components/customer/dashboard/CategoryCarousel.jsx
'use client';

import React, { useRef } from 'react';

export default function CategoryCarousel({ selectedCategory, onCategorySelect }) {
  const scrollRef = useRef(null);

  const categories = [
    { id: 'all', name: 'All', icon: '🍽️' },
    { id: 'pizza', name: 'Pizza', icon: '🍕' },
    { id: 'burger', name: 'Burgers', icon: '🍔' },
    { id: 'indian', name: 'Indian', icon: '🍛' },
    { id: 'chinese', name: 'Chinese', icon: '🥢' },
    { id: 'italian', name: 'Italian', icon: '🍝' },
    { id: 'desserts', name: 'Desserts', icon: '🍰' },
    { id: 'beverages', name: 'Beverages', icon: '🥤' },
    { id: 'healthy', name: 'Healthy', icon: '🥗' },
    { id: 'fast-food', name: 'Fast Food', icon: '🌭' },
    { id: 'south-indian', name: 'South Indian', icon: '🥞' },
    { id: 'north-indian', name: 'North Indian', icon: '🍜' }
  ];

  const scrollLeft = () => {
    scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
  };

  return (
    <div className="mb-6">
      <div className="relative">
        {/* Left scroll button */}
        <button
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Categories container */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide px-8 py-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategorySelect(category.id)}
              className={`flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-lg transition-all duration-200 min-w-[80px] ${
                selectedCategory === category.id
                  ? 'bg-orange-500 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
              }`}
            >
              <span className="text-2xl">{category.icon}</span>
              <span className="text-xs font-medium text-center leading-tight">
                {category.name}
              </span>
            </button>
          ))}
        </div>

        {/* Right scroll button */}
        <button
          onClick={scrollRight}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

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
