// components/customer/dashboard/RestaurantCard.jsx
import React from 'react';
import { Clock, Star, MapPin } from 'lucide-react';

export default function RestaurantCard({ restaurant, onAddToCart, selectedCategory }) {
  const handleRestaurantClick = () => {
    if (!restaurant.isOpen) {
      toast.error(`${restaurant.name} is currently closed. ${restaurant.closureReason || 'Please check back later.'}`);
      return;
    }
    // Navigate to restaurant page
    window.location.href = `/dashboard/customer/restaurant/${restaurant.id}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Restaurant Image */}
      <div className="relative">
        <img
          src={restaurant.image || '/default-restaurant.jpg'}
          alt={restaurant.name}
          className="w-full h-48 object-cover"
        />
        
        {/* Open/Closed Status Badge */}
        <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${
          restaurant.isOpen 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {restaurant.isOpen ? 'Open' : 'Closed'}
        </div>

        {/* Category Badge (if filtering by category) */}
        {selectedCategory !== 'all' && (
          <div className="absolute top-3 left-3 bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium">
            {selectedCategory}
          </div>
        )}
      </div>

      {/* Restaurant Info */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
            {restaurant.name}
          </h3>
          <div className="flex items-center gap-1 text-sm">
            <Star className="w-4 h-4 fill-orange-400 text-orange-400" />
            <span className="font-medium">{restaurant.rating}</span>
          </div>
        </div>

        <div className="flex items-center text-sm text-gray-600 mb-2">
          <Clock className="w-4 h-4 mr-1" />
          <span>{restaurant.deliveryTime}</span>
          <span className="mx-2">•</span>
          <span>{restaurant.workingHours}</span>
        </div>

        <div className="flex items-center text-sm text-gray-600 mb-3">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="line-clamp-1">{restaurant.address}</span>
        </div>

        {/* Closure Reason (if closed) */}
        {!restaurant.isOpen && restaurant.closureReason && (
          <div className="bg-red-50 border border-red-200 rounded p-2 mb-3">
            <p className="text-sm text-red-700">
              <strong>Closed:</strong> {restaurant.closureReason}
            </p>
          </div>
        )}

        {/* Menu Items Preview
        {restaurant.menuItems && restaurant.menuItems.length > 0 && (
          <div className="mb-3">
            <p className="text-sm text-gray-600 mb-2">
              {selectedCategory !== 'all' 
                ? `${selectedCategory} dishes (${restaurant.menuItems.length})`
                : `Popular items (${restaurant.menuItems.length})`
              }
            </p>
            <div className="flex flex-wrap gap-1">
              {restaurant.menuItems.slice(0, 3).map((item, index) => (
                <span
                  key={index}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                >
                  {item.name} ₹{item.price}
                </span>
              ))}
              {restaurant.menuItems.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{restaurant.menuItems.length - 3} more
                </span>
              )}
            </div>
          </div>
        )} */}

        {/* Action Button */}
        <button
          onClick={handleRestaurantClick}
          disabled={!restaurant.isOpen}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
            restaurant.isOpen
              ? 'bg-orange-600 text-white hover:bg-orange-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {restaurant.isOpen ? 'View Menu' : 'Currently Closed'}
        </button>
      </div>
    </div>
  );
}
