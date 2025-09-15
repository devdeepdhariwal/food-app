// app/dashboard/customer/select-address/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Plus, Check, Edit, Home, Briefcase, MapPinIcon, ArrowLeft } from 'lucide-react';

export default function SelectAddressPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await fetch('/api/profile/addresses');
      const data = await response.json();
      
      if (data.success) {
        setAddresses(data.addresses);
        // Set default address as selected
        const defaultAddr = data.addresses.find(addr => addr.isDefault);
        if (defaultAddr) setSelectedAddress(defaultAddr.id);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToCheckout = () => {
    if (!selectedAddress) {
      alert('Please select a delivery address');
      return;
    }

    const selected = addresses.find(addr => addr.id === selectedAddress);
    
    // Store selected address for checkout
    localStorage.setItem('selectedAddress', JSON.stringify(selected));
    
    // Navigate to checkout
    router.push('/dashboard/customer/checkout');
  };

  const getAddressIcon = (type) => {
    switch (type) {
      case 'home': return <Home className="w-5 h-5" />;
      case 'work': return <Briefcase className="w-5 h-5" />;
      default: return <MapPinIcon className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

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
            <h1 className="text-xl font-bold text-gray-900">Select Address</h1>
            <div className="w-16"></div> {/* Spacer */}
          </div>
          <p className="text-gray-600 text-center mt-2">Choose your delivery location</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Add New Address Button */}
        <button
          onClick={() => router.push('/dashboard/customer/add-address')}
          className="w-full mb-6 border-2 border-dashed border-orange-300 rounded-xl p-6 text-orange-600 hover:border-orange-500 hover:bg-orange-50 transition-colors flex items-center justify-center gap-3"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Add New Address</span>
        </button>

        {/* Address List */}
        <div className="space-y-4">
          {addresses.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses found</h3>
              <p className="text-gray-600 mb-6">Add your first delivery address to continue</p>
              <button
                onClick={() => router.push('/dashboard/customer/add-address')}
                className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 font-medium"
              >
                Add Address
              </button>
            </div>
          ) : (
            addresses.map((address) => (
              <div
                key={address.id}
                className={`bg-white rounded-xl shadow-sm p-6 cursor-pointer transition-all ${
                  selectedAddress === address.id
                    ? 'border-2 border-orange-500 ring-2 ring-orange-100'
                    : 'border border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedAddress(address.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-2 rounded-lg ${selectedAddress === address.id ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'}`}>
                      {getAddressIcon(address.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900">{address.label}</h3>
                        {address.isDefault && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {address.addressLine1}
                        {address.addressLine2 && `, ${address.addressLine2}`}
                        {address.landmark && ` (Near ${address.landmark})`}
                        <br />
                        {address.city}, {address.state} - {address.pincode}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedAddress === address.id && (
                      <div className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/customer/edit-address/${address.id}`);
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Continue Button */}
        {addresses.length > 0 && (
          <button
            onClick={handleContinueToCheckout}
            disabled={!selectedAddress}
            className="w-full mt-8 bg-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Checkout
          </button>
        )}
      </div>
    </div>
  );
}
