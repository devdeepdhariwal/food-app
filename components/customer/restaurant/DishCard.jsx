// components/customer/restaurant/DishCard.jsx
'use client';

import React, { useState } from 'react';
import Image from 'next/image';

export default function DishCard({ dish, onAddToCart, quantityInCart = 0 }) {
  const [showCustomization, setShowCustomization] = useState(false);
  const [selectedCustomizations, setSelectedCustomizations] = useState({});

  const handleAddToCart = () => {
    if (dish.customizations && dish.customizations.length > 0) {
      setShowCustomization(true);
    } else {
      onAddToCart(dish, {});
    }
  };

  const handleCustomizationConfirm = () => {
    onAddToCart(dish, selectedCustomizations);
    setShowCustomization(false);
    setSelectedCustomizations({});
  };

  const handleCustomizationChange = (customization, option) => {
    setSelectedCustomizations(prev => ({
      ...prev,
      [customization.name]: option
    }));
  };

  const getSpiceLevelColor = (level) => {
    switch (level) {
      case 'mild': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'spicy': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSpiceLevelIcon = (level) => {
    switch (level) {
      case 'mild': return '🌶️';
      case 'medium': return '🌶️🌶️';
      case 'spicy': return '🌶️🌶️🌶️';
      default: return '';
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        <div className="flex gap-4 p-4">
          {/* Dish Image */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-200">
              {dish.image ? (
                <Image
                  src={dish.image}
                  alt={dish.name}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Dish Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-start gap-2">
                {/* Veg/Non-Veg Indicator */}
                <div className={`w-4 h-4 border-2 flex items-center justify-center ${
                  dish.isVeg ? 'border-green-500' : 'border-red-500'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    dish.isVeg ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                </div>
                
                <h3 className="font-semibold text-gray-900">{dish.name}</h3>
              </div>
              
              <span className="font-bold text-gray-900">₹{dish.price}</span>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {dish.description}
            </p>

            {/* Tags and Info */}
            <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
              {dish.spiceLevel && (
                <div className={`flex items-center gap-1 ${getSpiceLevelColor(dish.spiceLevel)}`}>
                  <span>{getSpiceLevelIcon(dish.spiceLevel)}</span>
                  <span className="capitalize">{dish.spiceLevel}</span>
                </div>
              )}
              
              {dish.preparationTime && (
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{dish.preparationTime} min</span>
                </div>
              )}

              {dish.nutritionalInfo?.calories && (
                <div className="flex items-center gap-1">
                  <span>🔥</span>
                  <span>{dish.nutritionalInfo.calories} cal</span>
                </div>
              )}
            </div>

            {/* Add to Cart Section */}
            <div className="flex items-center justify-between">
              {quantityInCart > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {quantityInCart} in cart
                  </span>
                  <button
                    onClick={handleAddToCart}
                    className="bg-orange-500 text-white px-3 py-1 rounded-md text-sm hover:bg-orange-600 transition-colors"
                  >
                    Add More
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleAddToCart}
                  className="bg-orange-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-600 transition-colors"
                >
                  Add to Cart
                </button>
              )}

              {dish.customizations && dish.customizations.length > 0 && (
                <button
                  onClick={() => setShowCustomization(true)}
                  className="text-orange-500 text-sm hover:text-orange-600 transition-colors"
                >
                  Customize
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Customization Modal */}
      {showCustomization && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Customize {dish.name}</h3>
                <button
                  onClick={() => setShowCustomization(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {dish.customizations?.map((customization, index) => (
                  <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <h4 className="font-medium text-gray-900 mb-2">
                      {customization.name}
                      {customization.required && <span className="text-red-500 ml-1">*</span>}
                    </h4>
                    <div className="space-y-2">
                      {customization.options.map((option, optionIndex) => (
                        <label key={optionIndex} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <input
                              type={customization.type === 'single' ? 'radio' : 'checkbox'}
                              name={`customization-${index}`}
                              value={option.name}
                              onChange={() => handleCustomizationChange(customization, option)}
                              className="mr-2"
                            />
                            <span className="text-sm">{option.name}</span>
                          </div>
                          {option.price > 0 && (
                            <span className="text-sm text-gray-600">+₹{option.price}</span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCustomization(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCustomizationConfirm}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
