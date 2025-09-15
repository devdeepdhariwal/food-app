// components/customer/dashboard/FilterPanel.jsx
'use client';

import React from 'react';

export default function FilterPanel({ filters, onFiltersChange, onClose }) {
  const handleFilterChange = (key, value) => {
    onFiltersChange({ [key]: value });
  };

  const resetFilters = () => {
    onFiltersChange({
      sortBy: 'relevance',
      vegOnly: false,
      minRating: 0,
      maxDeliveryTime: 60,
      freeDelivery: false
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={resetFilters}
            className="text-sm text-orange-500 hover:text-orange-600"
          >
            Reset All
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="relevance">Relevance</option>
            <option value="rating">Rating</option>
            <option value="deliveryTime">Delivery Time</option>
            <option value="distance">Distance</option>
            <option value="priceRange">Price Range</option>
          </select>
        </div>

        {/* Rating Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Rating
          </label>
          <select
            value={filters.minRating}
            onChange={(e) => handleFilterChange('minRating', parseFloat(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value={0}>Any Rating</option>
            <option value={3.0}>3.0+</option>
            <option value={3.5}>3.5+</option>
            <option value={4.0}>4.0+</option>
            <option value={4.5}>4.5+</option>
          </select>
        </div>

        {/* Delivery Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Delivery Time
          </label>
          <select
            value={filters.maxDeliveryTime}
            onChange={(e) => handleFilterChange('maxDeliveryTime', parseInt(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value={60}>Any Time</option>
            <option value={30}>Under 30 min</option>
            <option value={45}>Under 45 min</option>
            <option value={60}>Under 60 min</option>
          </select>
        </div>

        {/* Checkboxes */}
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.vegOnly}
              onChange={(e) => handleFilterChange('vegOnly', e.target.checked)}
              className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700">Pure Veg Only</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.freeDelivery}
              onChange={(e) => handleFilterChange('freeDelivery', e.target.checked)}
              className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700">Free Delivery</span>
          </label>
        </div>
      </div>
    </div>
  );
}
