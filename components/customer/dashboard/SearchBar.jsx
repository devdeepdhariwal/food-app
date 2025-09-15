// components/customer/dashboard/SearchBar.jsx
'use client';

import React, { useState, useEffect, useRef } from 'react';

export default function SearchBar({ searchQuery, onSearch, userPincode, onPincodeChange }) {
  const [isPincodeDropdownOpen, setIsPincodeDropdownOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(searchQuery);
  const [pincodeInput, setPincodeInput] = useState('');
  const [selectedPincode, setSelectedPincode] = useState(null);
  const [pincodeStatus, setPincodeStatus] = useState('none'); // none, detecting, selected, error
  
  const searchRef = useRef(null);
  const pincodeRef = useRef(null);

  // Popular pincodes with their area details
  const popularPincodes = [
    { pincode: '110001', city: 'Delhi', area: 'Connaught Place', state: 'Delhi' },
    { pincode: '110016', city: 'Delhi', area: 'Lajpat Nagar', state: 'Delhi' },
    { pincode: '400001', city: 'Mumbai', area: 'Fort', state: 'Maharashtra' },
    { pincode: '400050', city: 'Mumbai', area: 'Bandra West', state: 'Maharashtra' },
    { pincode: '560001', city: 'Bangalore', area: 'Shivaji Nagar', state: 'Karnataka' },
    { pincode: '560095', city: 'Bangalore', area: 'Brookefield', state: 'Karnataka' },
    { pincode: '125001', city: 'Hisar', area: 'Civil Lines', state: 'Haryana' },
    { pincode: '125004', city: 'Hisar', area: 'Model Town', state: 'Haryana' },
    { pincode: '122001', city: 'Gurgaon', area: 'Sector 4', state: 'Haryana' },
    { pincode: '201301', city: 'Noida', area: 'Sector 1', state: 'Uttar Pradesh' }
  ];

  // Sample food suggestions
  const popularSearches = [
    'Pizza', 'Burger', 'Chinese', 'Indian', 'Biryani', 
    'Ice cream', 'Pasta', 'Sandwich', 'South Indian', 'North Indian'
  ];

  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  // Check if user has selected a pincode
  useEffect(() => {
    if (userPincode) {
      setSelectedPincode(userPincode);
      setPincodeStatus('selected');
    }
  }, [userPincode]);

  // Handle search input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    
    if (value.length > 0) {
      const filtered = popularSearches.filter(item =>
        item.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle search submission
  const handleSearch = (query = inputValue) => {
    onSearch(query);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    handleSearch(suggestion);
  };

  // Handle pincode submission
  const handlePincodeSubmit = async () => {
    if (!pincodeInput.trim() || pincodeInput.length !== 6) {
      alert('Please enter a valid 6-digit pincode');
      return;
    }

    setPincodeStatus('detecting');

    try {
      // First check if it's in our popular pincodes
      const popularPincode = popularPincodes.find(p => p.pincode === pincodeInput);
      
      if (popularPincode) {
        handlePincodeSelect(popularPincode);
        return;
      }

      // Check with API (you can implement this API later)
      const response = await fetch(`/api/customer/pincode/${pincodeInput}`);
      const data = await response.json();

      if (data.success) {
        handlePincodeSelect(data.pincode);
      } else {
        // For now, create a basic pincode object if not found in API
        const basicPincode = {
          pincode: pincodeInput,
          city: 'Unknown City',
          area: 'Unknown Area',
          state: 'Unknown State'
        };
        handlePincodeSelect(basicPincode);
      }
    } catch (error) {
      console.error('Error validating pincode:', error);
      // Still allow the pincode to be used
      const basicPincode = {
        pincode: pincodeInput,
        city: 'Unknown City',
        area: 'Unknown Area',
        state: 'Unknown State'
      };
      handlePincodeSelect(basicPincode);
    }
  };

  // Handle pincode selection
  const handlePincodeSelect = (pincode) => {
    setSelectedPincode(pincode);
    onPincodeChange(pincode.pincode); // Pass only pincode string to parent
    setPincodeStatus('selected');
    setIsPincodeDropdownOpen(false);
    setPincodeInput('');
  };

  // Get current location (will try to detect pincode from coordinates)
  const handleCurrentLocation = () => {
    setPincodeStatus('detecting');
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // In a real app, you'd reverse geocode to get pincode from coordinates
            // For now, we'll use a default pincode
            const defaultPincode = popularPincodes[0]; // Delhi as default
            handlePincodeSelect(defaultPincode);
          } catch (error) {
            console.warn('Could not determine pincode from location');
            setPincodeStatus('error');
          }
        },
        (error) => {
          console.warn('Location access denied:', error.message);
          setPincodeStatus('error');
        },
        {
          timeout: 10000,
          enableHighAccuracy: true,
          maximumAge: 300000
        }
      );
    } else {
      setPincodeStatus('error');
    }
  };

  // Get display text for pincode button
  const getPincodeDisplayText = () => {
    if (pincodeStatus === 'detecting') return 'Detecting location...';
    if (selectedPincode) {
      return selectedPincode.area 
        ? `${selectedPincode.city}, ${selectedPincode.pincode}`
        : `${selectedPincode.city} - ${selectedPincode.pincode}`;
    }
    return 'Enter Pincode';
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
      if (pincodeRef.current && !pincodeRef.current.contains(event.target)) {
        setIsPincodeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center">
      {/* Pincode Selector */}
      <div className="relative" ref={pincodeRef}>
        <button
          onClick={() => setIsPincodeDropdownOpen(!isPincodeDropdownOpen)}
          disabled={pincodeStatus === 'detecting'}
          className={`flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 min-w-[220px] transition-colors ${
            pincodeStatus === 'detecting' ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm text-gray-700 truncate">
            {getPincodeDisplayText()}
          </span>
          {pincodeStatus !== 'detecting' && (
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>

        {isPincodeDropdownOpen && (
          <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-w-sm">
            {/* Current Location Option */}
            <button
              onClick={handleCurrentLocation}
              disabled={pincodeStatus === 'detecting'}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100 ${
                pincodeStatus === 'detecting' ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span className="text-sm">
                {pincodeStatus === 'detecting' ? 'Detecting...' : 'Use Current Location'}
              </span>
            </button>

            {/* Pincode Input */}
            <div className="p-4 border-b border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter your 6-digit pincode
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="125001"
                  value={pincodeInput}
                  onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyPress={(e) => e.key === 'Enter' && handlePincodeSubmit()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  maxLength="6"
                  autoComplete="postal-code"
                />
                <button
                  onClick={handlePincodeSubmit}
                  disabled={pincodeInput.length !== 6}
                  className="px-3 py-2 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Check
                </button>
              </div>
            </div>

            {/* Popular Pincodes */}
            <div className="max-h-64 overflow-y-auto">
              <div className="px-4 py-2">
                <p className="text-xs text-gray-500 mb-2">Popular Areas</p>
              </div>
              
              {popularPincodes.map((pincode, index) => (
                <button
                  key={index}
                  onClick={() => handlePincodeSelect(pincode)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <div className="font-medium">{pincode.city} - {pincode.area}</div>
                  <div className="text-xs text-gray-500">{pincode.pincode} • {pincode.state}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative flex-1 max-w-md" ref={searchRef}>
        <div className="relative">
          <input
            type="text"
            placeholder="Search for restaurants, cuisines, or dishes..."
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
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
          {inputValue && (
            <button
              onClick={() => {
                setInputValue('');
                handleSearch('');
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Search Suggestions */}
        {showSuggestions && (suggestions.length > 0 || inputValue.length === 0) && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            {inputValue.length === 0 ? (
              <div className="p-4">
                <p className="text-sm text-gray-500 mb-2">Popular Searches</p>
                <div className="space-y-1">
                  {popularSearches.slice(0, 5).map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(item)}
                      className="w-full text-left px-2 py-1 text-sm text-gray-700 hover:bg-gray-50 rounded flex items-center gap-2"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {suggestion}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
