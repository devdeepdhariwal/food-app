// app/dashboard/customer/complete-profile/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, MapPin, Plus, ArrowRight, Check, ArrowLeft, Phone, Mail, Calendar, Users } from 'lucide-react';

export default function CompleteProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [profile, setProfile] = useState(null);

  // Form states
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    gender: ''
  });

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    type: 'home',
    label: 'Home',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: true
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile/me');
      const data = await response.json();
      
      if (data.success) {
        setProfile(data.profile);
        
        // Pre-fill personal info if available
        if (data.profile.personalInfo) {
          setPersonalInfo({
            firstName: data.profile.personalInfo.firstName || '',
            lastName: data.profile.personalInfo.lastName || '',
            phone: data.profile.personalInfo.phone || '',
            email: data.profile.personalInfo.email || '',
            dateOfBirth: data.profile.personalInfo.dateOfBirth ? 
              new Date(data.profile.personalInfo.dateOfBirth).toISOString().split('T')[0] : '',
            gender: data.profile.personalInfo.gender || ''
          });
        }
        
        // Determine current step based on completion
        console.log('📊 Profile completion status:', data.completion);
        
        if (!data.completion.personalInfo) {
          setCurrentStep(1);
          console.log('📝 Starting with personal info step');
        } else if (!data.completion.addressInfo) {
          setCurrentStep(2);
          console.log('📍 Moving to address step');
        } else {
          console.log('✅ Profile complete, redirecting...');
          // Profile is complete, check if coming from checkout
          const checkoutData = localStorage.getItem('checkoutData');
          if (checkoutData) {
            router.push('/dashboard/customer/select-address');
          } else {
            router.push('/dashboard/customer/profile');
          }
          return;
        }
      } else {
        console.error('Failed to fetch profile:', data.error);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePersonalInfoChange = (e) => {
    const { name, value } = e.target;
    setPersonalInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewAddress(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePersonalInfoSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      console.log('💾 Saving personal info:', personalInfo);
      
      const response = await fetch('/api/profile/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personalInfo })
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Personal info saved successfully');
        setProfile(data.profile);
        setCurrentStep(2);
      } else {
        console.error('❌ Failed to save personal info:', data.error);
        alert('Failed to save personal information. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error saving personal info:', error);
      alert('Failed to save personal information. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      console.log('💾 Saving address:', newAddress);
      
      const response = await fetch('/api/profile/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAddress)
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Address saved successfully');
        
        // Check if we came from checkout flow
        const checkoutData = localStorage.getItem('checkoutData');
        if (checkoutData) {
          console.log('🛒 Redirecting to address selection for checkout');
          router.push('/dashboard/customer/select-address');
        } else {
          console.log('👤 Redirecting to profile page');
          router.push('/dashboard/customer/profile');
        }
      } else {
        console.error('❌ Failed to save address:', data.error);
        alert('Failed to save address. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error saving address:', error);
      alert('Failed to save address. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSkipAddress = () => {
    console.log('⏭️ Skipping address step');
    const checkoutData = localStorage.getItem('checkoutData');
    if (checkoutData) {
      router.push('/dashboard/customer/add-address');
    } else {
      router.push('/dashboard/customer/profile');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
            <h1 className="text-xl font-bold text-gray-900">Complete Profile</h1>
            <div className="w-16"></div> {/* Spacer */}
          </div>
          
          <p className="text-gray-600 text-center">Just a few details to get started</p>
          
          {/* Progress Bar */}
          <div className="flex items-center justify-center mt-6 space-x-4">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-orange-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                currentStep >= 1 ? 'border-orange-600 bg-orange-600 text-white' : 'border-gray-300'
              }`}>
                {currentStep > 1 ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <span className="ml-2 font-medium text-sm">Personal</span>
            </div>
            
            <div className={`w-12 h-0.5 ${currentStep > 1 ? 'bg-orange-600' : 'bg-gray-300'}`}></div>
            
            <div className={`flex items-center ${currentStep >= 2 ? 'text-orange-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                currentStep >= 2 ? 'border-orange-600 bg-orange-600 text-white' : 'border-gray-300'
              }`}>
                {currentStep > 2 ? <Check className="w-4 h-4" /> : '2'}
              </div>
              <span className="ml-2 font-medium text-sm">Address</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-100 rounded-lg">
                <User className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
                <p className="text-sm text-gray-600">Tell us about yourself</p>
              </div>
            </div>

            <form onSubmit={handlePersonalInfoSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={personalInfo.firstName}
                    onChange={handlePersonalInfoChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 font-bold placeholder-gray-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={personalInfo.lastName}
                    onChange={handlePersonalInfoChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 font-bold placeholder-gray-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={personalInfo.phone}
                  onChange={handlePersonalInfoChange}
                  placeholder="+91 9876543210"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 font-bold placeholder-gray-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={personalInfo.email}
                  onChange={handlePersonalInfoChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50 text-gray-900 font-bold"
                  required
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={personalInfo.dateOfBirth}
                    onChange={handlePersonalInfoChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={personalInfo.gender}
                    onChange={handlePersonalInfoChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 font-bold"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-orange-600 text-white py-4 rounded-xl hover:bg-orange-700 font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Address Information */}
        {currentStep === 2 && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-100 rounded-lg">
                <MapPin className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Add Your Address</h2>
                <p className="text-sm text-gray-600">Where should we deliver your orders?</p>
              </div>
            </div>

            {!showAddressForm ? (
              <div className="text-center py-8">
                <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Add your first address</h3>
                <p className="text-gray-600 mb-6">We need at least one address to deliver your orders</p>
                
                <div className="space-y-3">
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 font-medium flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Address
                  </button>
                  
                  <button
                    onClick={handleSkipAddress}
                    className="w-full text-gray-600 py-3 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Skip for now
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAddressSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address Type
                    </label>
                    <select
                      name="type"
                      value={newAddress.type}
                      onChange={handleAddressChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 font-bold"
                    >
                      <option value="home">Home</option>
                      <option value="work">Work</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Label *
                    </label>
                    <input
                      type="text"
                      name="label"
                      value={newAddress.label}
                      onChange={handleAddressChange}
                      placeholder="e.g., Home, Office"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 font-bold placeholder-gray-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    name="addressLine1"
                    value={newAddress.addressLine1}
                    onChange={handleAddressChange}
                    placeholder="House/Flat number, Street name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 font-bold placeholder-gray-500"
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
                    onChange={handleAddressChange}
                    placeholder="Area, Colony (Optional)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 font-bold placeholder-gray-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={newAddress.city}
                      onChange={handleAddressChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 font-bold placeholder-gray-500"
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
                      onChange={handleAddressChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 font-bold placeholder-gray-500"
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
                      onChange={handleAddressChange}
                      placeholder="123456"
                      maxLength="6"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 font-bold placeholder-gray-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Landmark
                  </label>
                  <input
                    type="text"
                    name="landmark"
                    value={newAddress.landmark}
                    onChange={handleAddressChange}
                    placeholder="Near famous landmark"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 font-bold placeholder-gray-500"
                  />
                </div>

                <div className="flex items-center gap-2 space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(false)}
                    className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Save Address</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
