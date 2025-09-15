// app/dashboard/delivery-partner/complete-profile/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Phone, 
  MapPin, 
  Car, 
  CreditCard, 
  Clock, 
  Camera,
  ArrowLeft,
  ArrowRight,
  Check,
  AlertCircle,
  Upload
} from 'lucide-react';

export default function CompleteProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [profile, setProfile] = useState(null);
  const [completion, setCompletion] = useState({ percentage: 0, isComplete: false });

  // Form states
  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    mobileNo: '',
    alternateNo: ''
  });

  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    pincode: ''
  });

  const [vehicleDetails, setVehicleDetails] = useState({
    vehicleType: '',
    vehicleNumber: '',
    licenseNumber: ''
  });

  const [bankDetails, setBankDetails] = useState({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: ''
  });

  const [workingHours, setWorkingHours] = useState([]);
  const [deliveryZones, setDeliveryZones] = useState(['']);

  const steps = [
    { id: 1, title: 'Personal Info', icon: User },
    { id: 2, title: 'Address', icon: MapPin },
    { id: 3, title: 'Vehicle Details', icon: Car },
    { id: 4, title: 'Bank Details', icon: CreditCard },
    { id: 5, title: 'Working Hours', icon: Clock }
  ];

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  useEffect(() => {
    fetchProfile();
  }, []);

  // ✅ FIXED: Enhanced fetchProfile with better working hours handling
  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/delivery-partner/profile');
      const data = await response.json();
      
      if (data.success) {
        setProfile(data.profile);
        setCompletion(data.completion);
        
        console.log('📋 Profile fetched:', data.profile);
        
        // Pre-fill form data
        if (data.profile) {
          setPersonalInfo({
            fullName: data.profile.fullName || '',
            mobileNo: data.profile.mobileNo || '',
            alternateNo: data.profile.alternateNo || ''
          });
          
          setAddress(data.profile.address || {
            street: '', city: '', state: '', pincode: ''
          });
          
          setVehicleDetails(data.profile.vehicleDetails || {
            vehicleType: '', vehicleNumber: '', licenseNumber: ''
          });
          
          setBankDetails(data.profile.bankDetails || {
            accountHolderName: '', accountNumber: '', ifscCode: '', bankName: ''
          });
          
          // ✅ FIXED: Better working hours handling
          if (data.profile.workingHours && data.profile.workingHours.length > 0) {
            console.log('📅 Setting existing working hours:', data.profile.workingHours);
            setWorkingHours(data.profile.workingHours);
          } else {
            console.log('📅 No working hours found, initializing defaults');
            const defaultHours = days.map(day => ({
              day,
              isWorking: true,
              startTime: '09:00',
              endTime: '22:00'
            }));
            setWorkingHours(defaultHours);
          }
          
          setDeliveryZones(data.profile.deliveryZones?.length ? data.profile.deliveryZones : ['']);
        }
        
        // Only redirect if profile is 100% complete AND verified
        if (data.completion.percentage === 100 && data.profile.isVerified) {
          console.log('Profile is complete and verified, redirecting to dashboard...');
          router.push('/dashboard/delivery-partner');
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Better initialization function
  const initializeWorkingHours = () => {
    if (workingHours.length === 0) {
      const defaultHours = days.map(day => ({
        day,
        isWorking: true,
        startTime: '09:00',
        endTime: '22:00'
      }));
      setWorkingHours(defaultHours);
      console.log('Initialized working hours:', defaultHours);
    }
  };

  const handlePersonalInfoSubmit = async (e) => {
    e.preventDefault();
    await updateProfile({ ...personalInfo });
    setCurrentStep(2);
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    await updateProfile({ address });
    setCurrentStep(3);
  };

  const handleVehicleSubmit = async (e) => {
    e.preventDefault();
    await updateProfile({ vehicleDetails });
    setCurrentStep(4);
  };

  const handleBankSubmit = async (e) => {
    e.preventDefault();
    await updateProfile({ bankDetails });
    setCurrentStep(5);
  };

  // ✅ FIXED: Enhanced handleFinalSubmit with better debugging
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🔄 Submitting final step...');
    console.log('Working Hours before submit:', workingHours);
    console.log('Delivery Zones before submit:', deliveryZones);
    
    const filteredZones = deliveryZones.filter(zone => zone && zone.trim());
    
    // ✅ FIXED: Ensure working hours are properly structured
    const validWorkingHours = workingHours.map((hour, index) => ({
      day: hour.day || days[index],
      isWorking: hour.isWorking !== undefined ? hour.isWorking : true,
      startTime: hour.startTime || '09:00',
      endTime: hour.endTime || '22:00'
    }));
    
    console.log('Valid working hours to save:', validWorkingHours);
    console.log('Filtered zones to save:', filteredZones);
    
    const updateData = { 
      workingHours: validWorkingHours, 
      deliveryZones: filteredZones 
    };
    
    console.log('Final update data:', updateData);
    
    await updateProfile(updateData);
    
    // Check if profile is complete and redirect
    const response = await fetch('/api/delivery-partner/profile');
    const data = await response.json();
    
    if (data.success && data.completion.percentage >= 90) {
      console.log('Profile completion sufficient, redirecting...');
      router.push('/dashboard/delivery-partner');
    } else {
      console.log('Profile completion:', data.completion);
    }
  };

  // ✅ FIXED: Enhanced updateProfile with better error handling
  const updateProfile = async (data) => {
    setSaving(true);
    try {
      console.log('🔄 Updating profile with data:', data);
      
      const response = await fetch('/api/delivery-partner/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      console.log('📡 API Response:', result);
      
      if (result.success) {
        setProfile(result.profile);
        setCompletion(result.completion);
        console.log('✅ Profile updated successfully');
      } else {
        console.error('❌ Profile update failed:', result);
        alert('Failed to update profile: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      alert('Failed to update profile: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const addDeliveryZone = () => {
    setDeliveryZones([...deliveryZones, '']);
  };

  const removeDeliveryZone = (index) => {
    setDeliveryZones(deliveryZones.filter((_, i) => i !== index));
  };

  const updateDeliveryZone = (index, value) => {
    const updated = [...deliveryZones];
    updated[index] = value;
    setDeliveryZones(updated);
  };

  // ✅ FIXED: Enhanced updateWorkingHour function
  const updateWorkingHour = (dayIndex, field, value) => {
    const updated = [...workingHours];
    
    // ✅ FIXED: Ensure the array has the right length and structure
    while (updated.length <= dayIndex) {
      const day = days[updated.length];
      updated.push({
        day,
        isWorking: true,
        startTime: '09:00',
        endTime: '22:00'
      });
    }
    
    // ✅ FIXED: Ensure the object exists before updating
    if (!updated[dayIndex]) {
      updated[dayIndex] = {
        day: days[dayIndex],
        isWorking: true,
        startTime: '09:00',
        endTime: '22:00'
      };
    }
    
    updated[dayIndex] = { ...updated[dayIndex], [field]: value };
    setWorkingHours(updated);
    
    // ✅ DEBUG: Log the updated working hours
    console.log('Updated working hours:', updated);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-bold">Back</span>
            </button>
            <h1 className="text-xl font-bold text-gray-900">Complete Your Profile</h1>
            <div className="w-16"></div>
          </div>
          
          <p className="text-gray-600 text-center font-medium">Setup your delivery partner account</p>
          
          {/* Progress Bar */}
          <div className="flex items-center justify-center mt-6 space-x-2 overflow-x-auto">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center ${currentStep >= step.id ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    currentStep >= step.id ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'
                  }`}>
                    {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
                  </div>
                  <span className="ml-2 font-bold text-xs">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-2 ${currentStep > step.id ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                )}
              </div>
            ))}
          </div>

          {/* Completion Percentage */}
          <div className="mt-4 text-center">
            <div className="text-sm font-bold text-gray-700">
              Profile Completion: {completion.percentage}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${completion.percentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
                <p className="text-sm text-gray-600">Tell us about yourself</p>
              </div>
            </div>

            <form onSubmit={handlePersonalInfoSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={personalInfo.fullName}
                  onChange={(e) => setPersonalInfo(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-bold placeholder-gray-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  value={personalInfo.mobileNo}
                  onChange={(e) => setPersonalInfo(prev => ({ ...prev, mobileNo: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-bold placeholder-gray-500"
                  placeholder="+91 9876543210"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Alternate Number
                </label>
                <input
                  type="tel"
                  value={personalInfo.alternateNo}
                  onChange={(e) => setPersonalInfo(prev => ({ ...prev, alternateNo: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-bold placeholder-gray-500"
                  placeholder="+91 9876543210"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-blue-600 text-white py-4 rounded-xl hover:bg-blue-700 font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
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

        {/* Step 2: Address */}
        {currentStep === 2 && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Address Details</h2>
                <p className="text-sm text-gray-600">Where are you located?</p>
              </div>
            </div>

            <form onSubmit={handleAddressSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  value={address.street}
                  onChange={(e) => setAddress(prev => ({ ...prev, street: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-bold placeholder-gray-500"
                  placeholder="House/Flat number, Street name"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={address.city}
                    onChange={(e) => setAddress(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-bold placeholder-gray-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    value={address.state}
                    onChange={(e) => setAddress(prev => ({ ...prev, state: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-bold placeholder-gray-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    value={address.pincode}
                    onChange={(e) => setAddress(prev => ({ ...prev, pincode: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-bold placeholder-gray-500"
                    placeholder="123456"
                    maxLength="6"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 font-bold"
                >
                  Back
                </button>
                
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-bold flex items-center justify-center gap-2 disabled:opacity-50"
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
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Vehicle Details */}
        {currentStep === 3 && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Car className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Vehicle Details</h2>
                <p className="text-sm text-gray-600">Tell us about your delivery vehicle</p>
              </div>
            </div>

            <form onSubmit={handleVehicleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Vehicle Type *
                </label>
                <select
                  value={vehicleDetails.vehicleType}
                  onChange={(e) => setVehicleDetails(prev => ({ ...prev, vehicleType: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-bold"
                  required
                >
                  <option value="">Select vehicle type</option>
                  <option value="bike">Bike</option>
                  <option value="scooter">Scooter</option>
                  <option value="bicycle">Bicycle</option>
                  <option value="car">Car</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Vehicle Number *
                </label>
                <input
                  type="text"
                  value={vehicleDetails.vehicleNumber}
                  onChange={(e) => setVehicleDetails(prev => ({ ...prev, vehicleNumber: e.target.value.toUpperCase() }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-bold placeholder-gray-500"
                  placeholder="HR01AB1234"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Driving License Number *
                </label>
                <input
                  type="text"
                  value={vehicleDetails.licenseNumber}
                  onChange={(e) => setVehicleDetails(prev => ({ ...prev, licenseNumber: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-bold placeholder-gray-500"
                  placeholder="DL1234567890"
                  required
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 font-bold"
                >
                  Back
                </button>
                
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-bold flex items-center justify-center gap-2 disabled:opacity-50"
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
              </div>
            </form>
          </div>
        )}

        {/* Step 4: Bank Details */}
        {currentStep === 4 && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Bank Details</h2>
                <p className="text-sm text-gray-600">For receiving your earnings</p>
              </div>
            </div>

            <form onSubmit={handleBankSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Account Holder Name *
                </label>
                <input
                  type="text"
                  value={bankDetails.accountHolderName}
                  onChange={(e) => setBankDetails(prev => ({ ...prev, accountHolderName: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-bold placeholder-gray-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Account Number *
                </label>
                <input
                  type="text"
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-bold placeholder-gray-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    IFSC Code *
                  </label>
                  <input
                    type="text"
                    value={bankDetails.ifscCode}
                    onChange={(e) => setBankDetails(prev => ({ ...prev, ifscCode: e.target.value.toUpperCase() }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-bold placeholder-gray-500"
                    placeholder="SBIN0001234"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    value={bankDetails.bankName}
                    onChange={(e) => setBankDetails(prev => ({ ...prev, bankName: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-bold placeholder-gray-500"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 font-bold"
                >
                  Back
                </button>
                
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-bold flex items-center justify-center gap-2 disabled:opacity-50"
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
              </div>
            </form>
          </div>
        )}

        {/* Step 5: Working Hours & Delivery Zones */}
        {currentStep === 5 && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Working Hours & Zones</h2>
                <p className="text-sm text-gray-600">Set your availability and delivery areas</p>
              </div>
            </div>

            <form onSubmit={handleFinalSubmit} className="space-y-8">
              
              {/* ✅ FIXED: Working Hours with safer access */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Working Hours</h3>
                <div className="space-y-4">
                  {days.map((day, index) => {
                    // ✅ FIXED: Safer access to working hours
                    const dayData = workingHours[index] || {
                      day,
                      isWorking: true,
                      startTime: '09:00',
                      endTime: '22:00'
                    };
                    
                    return (
                      <div key={day} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                        <div className="w-20">
                          <span className="font-bold text-gray-900 capitalize">{day}</span>
                        </div>
                        
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={dayData.isWorking}
                            onChange={(e) => updateWorkingHour(index, 'isWorking', e.target.checked)}
                            className="text-blue-600 rounded"
                          />
                          <span className="font-bold text-gray-700">Working</span>
                        </label>
                        
                        {dayData.isWorking && (
                          <>
                            <input
                              type="time"
                              value={dayData.startTime}
                              onChange={(e) => updateWorkingHour(index, 'startTime', e.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-bold"
                            />
                            <span className="font-bold text-gray-500">to</span>
                            <input
                              type="time"
                              value={dayData.endTime}
                              onChange={(e) => updateWorkingHour(index, 'endTime', e.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-bold"
                            />
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Delivery Zones */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Delivery Zones (Pincodes)</h3>
                <div className="space-y-3">
                  {deliveryZones.map((zone, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <input
                        type="text"
                        value={zone}
                        onChange={(e) => updateDeliveryZone(index, e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-bold placeholder-gray-500"
                        placeholder="Enter pincode (e.g., 125001)"
                        maxLength="6"
                      />
                      {deliveryZones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeDeliveryZone(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <AlertCircle className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={addDeliveryZone}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-bold text-gray-700"
                  >
                    <MapPin className="w-4 h-4" />
                    Add Another Zone
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 font-bold"
                >
                  Back
                </button>
                
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Complete Profile</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
