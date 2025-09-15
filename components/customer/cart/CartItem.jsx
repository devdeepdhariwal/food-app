// components/customer/cart/CartItem.jsx
'use client';

import React from 'react';
import Image from 'next/image';

export default function CartItem({ item, onUpdateQuantity, onRemove }) {
  const handleQuantityChange = (newQuantity) => {
    if (newQuantity === 0) {
      onRemove(item.id);
    } else {
      onUpdateQuantity(item.id, newQuantity);
    }
  };

  return (
    <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
      {/* Item Image */}
      <div className="flex-shrink-0">
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Item Details */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 text-sm">{item.name}</h4>
        <p className="text-sm text-gray-600 mt-1">₹{item.price}</p>
        
        {/* Customizations */}
        {Object.keys(item.customizations || {}).length > 0 && (
          <div className="text-xs text-gray-500 mt-1">
            {Object.entries(item.customizations).map(([key, value]) => (
              <div key={key}>
                {key}: {value.name} {value.price > 0 && `(+₹${value.price})`}
              </div>
            ))}
          </div>
        )}

        {/* Quantity Controls */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => handleQuantityChange(item.quantity - 1)}
            className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="text-sm font-medium min-w-[20px] text-center">{item.quantity}</span>
          <button
            onClick={() => handleQuantityChange(item.quantity + 1)}
            className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Item Total and Remove */}
      <div className="flex flex-col items-end justify-between">
        <button
          onClick={() => onRemove(item.id)}
          className="text-red-500 hover:text-red-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
        <span className="font-semibold text-sm">₹{item.price * item.quantity}</span>
      </div>
    </div>
  );
}
