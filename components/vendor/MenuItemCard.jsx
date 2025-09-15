'use client';

import { useState } from 'react';
import { Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MenuItemCard({ item, onEdit, onDelete, onToggleAvailability }) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggleAvailability = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/vendor/menu/${item._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isAvailable: !item.isAvailable
        }),
      });

      if (response.ok) {
        onToggleAvailability(item._id, !item.isAvailable);
        toast.success(
          item.isAvailable ? 'Item marked unavailable' : 'Item marked available'
        );
      } else {
        toast.error('Failed to update availability');
      }
    } catch (error) {
      toast.error('Failed to update availability');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${item.dishName}"?`)) {
      onDelete(item._id);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow border-2 overflow-hidden transition-all ${
      item.isAvailable ? 'border-green-200' : 'border-red-200 opacity-75'
    }`}>
      {/* Image */}
      <div className="h-48 bg-gray-200 relative">
        {item.photo ? (
          <img
            src={item.photo}
            alt={item.dishName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <span>No Image</span>
          </div>
        )}
        
        {/* Veg/Non-veg indicator */}
        <div className="absolute top-2 left-2">
          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
            item.isVeg ? 'border-green-600' : 'border-red-600'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              item.isVeg ? 'bg-green-600' : 'bg-red-600'
            }`}></div>
          </div>
        </div>

        {/* Availability badge */}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            item.isAvailable 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {item.isAvailable ? 'Available' : 'Unavailable'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-900 text-lg">{item.dishName}</h3>
          <span className="text-orange-600 font-bold text-lg">₹{item.price}</span>
        </div>

        <p className="text-sm text-gray-600 mb-2">{item.category}</p>
        
        {item.description && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">
            {item.description}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <span>Prep: {item.preparationTime} min</span>
          <span>{item.isVeg ? '🌱 Vegetarian' : '🍖 Non-Vegetarian'}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleToggleAvailability}
            disabled={isUpdating}
            className={`flex items-center px-3 py-1 rounded-md text-sm transition-colors ${
              item.isAvailable
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            } disabled:opacity-50`}
          >
            {item.isAvailable ? (
              <>
                <ToggleRight className="w-4 h-4 mr-1" />
                Disable
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4 mr-1" />
                Enable
              </>
            )}
          </button>

          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(item)}
              className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
            >
              <Edit2 className="w-4 h-4 mr-1" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
