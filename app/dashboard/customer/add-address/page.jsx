// app/dashboard/customer/add-address/page.jsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, ArrowLeft, Home, Briefcase, MapPinIcon, Check } from 'lucide-react';

export default function AddAddressPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [newAddress, setNewAddress] = useState({
    type: 'home',
    label: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewAddress(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/profile/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAddress)
      });

      const data = await response.json();
      
      if (data.success) {
        // Check if we came from checkout flow
        const checkoutData = localStorage.getItem('checkoutData');
        if (checkoutData) {
          router.push('/dashboard/customer/select-address');
        } else {
          router.push('/dashboard/customer/profile');
        }
      } else {
        alert('Failed to save address');
      }
    } catch (error) {
      console.error('Error saving address:', error);
      alert('Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const getAddressIcon = (type) => {
    switch (type) {
      case 'home': return <Home className="w-5 h-5" />;
      case 'work': return <Briefcase className="w-5 h-5" />;
      default: return <MapPinIcon className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
            <h1 className="text-xl font-bold text-gray-900">Add New Address</h1>
            <div className="w-16"></div> {/* Spacer */}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Address Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Address Type
              </label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { type: 'home', label: 'Home', icon: Home },
                  { type: 'work', label: 'Work', icon: Briefcase },
                  { type: 'other', label: 'Other', icon: MapPinIcon }
                ].map(({ type, label, icon: Icon }) => (
                  <label
                    key={type}
                    className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      newAddress.type === type
                        ? 'border-orange-500 bg-orange-50 text-orange-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={type}
                      checked={newAddress.type === type}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <Icon className="w-6 h-6" />
                    <span className="font-medium">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Address Label */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address Label *
              </label>
              <input
                type="text"
                name="label"
                value={newAddress.label}
                onChange={handleInputChange}
                placeholder="e.g., Home, Office, Mom's Place"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>

            {/* Address Lines */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  name="addressLine1"
                  value={newAddress.addressLine1}
                  onChange={handleInputChange}
                  placeholder="House/Flat number, Street name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address Line 2
                </label>
                <input
                  type="text"
                  name="addressLine2"
                  value={newAddress.addressLine2}
                  onChange={handleInputChange}
                  placeholder="Area, Colony (Optional)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>

            {/* City, State, Pincode */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={newAddress.city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
                <input
                  type="text"
                  name="state"
                  value={newAddress.state}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pincode *
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={newAddress.pincode}
                  onChange={handleInputChange}
                  placeholder="123456"
                  maxLength="6"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>
            </div>

            {/* Landmark */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Landmark
              </label>
              <input
                type="text"
                name="landmark"
                value={newAddress.landmark}
                onChange={handleInputChange}
                placeholder="Near famous landmark (Optional)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {/* Default Address Checkbox */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isDefault"
                name="isDefault"
                checked={newAddress.isDefault}
                onChange={handleInputChange}
                className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
              />
              <label htmlFor="isDefault" className="text-sm font-medium text-gray-700">
                Set as default address
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>Save Address</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
