// app/dashboard/delivery-partner/profile/page.jsx
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
  ArrowLeft,
  Edit,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Shield,
  Eye,
  EyeOff,
  Star,
  Package
} from 'lucide-react';

export default function DeliveryPartnerProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [completion, setCompletion] = useState({ percentage: 0, isComplete: false });
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [showBankDetails, setShowBankDetails] = useState(false);

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/delivery-partner/profile');
      const data = await response.json();
      
      if (data.success) {
        setProfile(data.profile);
        setCompletion(data.completion);
        setEditData(data.profile);
        
        // If profile is incomplete, redirect to complete profile
        if (!data.completion.isComplete) {
          router.push('/dashboard/delivery-partner/complete-profile');
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/delivery-partner/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });

      const result = await response.json();
      
      if (result.success) {
        setProfile(result.profile);
        setCompletion(result.completion);
        setIsEditing(false);
        alert('Profile updated successfully!');
      } else {
        alert('Failed to update profile: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData(profile);
    setIsEditing(false);
  };

  const updateEditData = (path, value) => {
    setEditData(prev => {
      const updated = { ...prev };
      const keys = path.split('.');
      let current = updated;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  const updateWorkingHour = (dayIndex, field, value) => {
    const updated = [...(editData.workingHours || [])];
    if (!updated[dayIndex]) {
      updated[dayIndex] = { day: days[dayIndex], isWorking: true, startTime: '09:00', endTime: '22:00' };
    }
    updated[dayIndex] = { ...updated[dayIndex], [field]: value };
    setEditData(prev => ({ ...prev, workingHours: updated }));
  };

  const getVerificationStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-600';
      case 'in_review': return 'text-yellow-600';
      case 'rejected': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getVerificationStatusText = (status) => {
    switch (status) {
      case 'approved': return 'Verified';
      case 'in_review': return 'Under Review';
      case 'rejected': return 'Rejected';
      default: return 'Pending Verification';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-bold">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-6">Unable to load your delivery partner profile.</p>
          <button
            onClick={() => router.push('/dashboard/delivery-partner')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-bold"
          >
            Go to Dashboard
          </button>
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
              onClick={() => router.push('/dashboard/delivery-partner')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-bold">Back to Dashboard</span>
            </button>
            
            <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
            
            <div className="flex items-center gap-3">
              {!isEditing && profile.isVerified && (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full">
                  <Shield className="w-4 h-4" />
                  <span className="text-xs font-bold">Verified</span>
                </div>
              )}
              
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold"
                  disabled={profile.isVerified}
                >
                  <Edit className="w-4 h-4" />
                  {profile.isVerified ? 'Verified' : 'Edit Profile'}
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-bold"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Profile Completion Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${completion.isComplete ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="font-bold text-gray-900">
                  Profile {completion.isComplete ? 'Complete' : 'Incomplete'} ({completion.percentage}%)
                </span>
              </div>
              
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${getVerificationStatusColor(profile.verificationStatus)} bg-opacity-10`}>
                {getVerificationStatusText(profile.verificationStatus)}
              </div>
            </div>

            <div className="text-sm font-medium text-gray-600">
              Last updated: {new Date(profile.updatedAt).toLocaleDateString('en-IN')}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-600">Total Deliveries</p>
                <p className="text-2xl font-bold text-blue-600">{profile.deliveryStats?.completedDeliveries || 0}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-600">Rating</p>
                <div className="flex items-center gap-1">
                  <p className="text-2xl font-bold text-yellow-600">{(profile.rating?.average || 0).toFixed(1)}</p>
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                </div>
              </div>
              <Star className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-600">Status</p>
                <p className={`text-lg font-bold ${profile.isAvailable ? 'text-green-600' : 'text-gray-600'}`}>
                  {profile.isAvailable ? 'Available' : 'Offline'}
                </p>
              </div>
              <div className={`w-8 h-8 rounded-full ${profile.isAvailable ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-green-600">₹{profile.deliveryStats?.totalEarnings || 0}</p>
              </div>
              <CreditCard className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.fullName || ''}
                  onChange={(e) => updateEditData('fullName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-bold"
                />
              ) : (
                <p className="text-gray-900 font-bold py-3">{profile.fullName || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Mobile Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editData.mobileNo || ''}
                  onChange={(e) => updateEditData('mobileNo', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-bold"
                />
              ) : (
                <p className="text-gray-900 font-bold py-3">{profile.mobileNo || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Alternate Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editData.alternateNo || ''}
                  onChange={(e) => updateEditData('alternateNo', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-bold"
                />
              ) : (
                <p className="text-gray-900 font-bold py-3">{profile.alternateNo || 'Not provided'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Address Information</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Street Address</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.address?.street || ''}
                  onChange={(e) => updateEditData('address.street', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-bold"
                />
              ) : (
                <p className="text-gray-900 font-bold py-3">{profile.address?.street || 'Not provided'}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">City</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.address?.city || ''}
                    onChange={(e) => updateEditData('address.city', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-bold"
                  />
                ) : (
                  <p className="text-gray-900 font-bold py-3">{profile.address?.city || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">State</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.address?.state || ''}
                    onChange={(e) => updateEditData('address.state', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-bold"
                  />
                ) : (
                  <p className="text-gray-900 font-bold py-3">{profile.address?.state || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Pincode</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.address?.pincode || ''}
                    onChange={(e) => updateEditData('address.pincode', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-bold"
                    maxLength="6"
                  />
                ) : (
                  <p className="text-gray-900 font-bold py-3">{profile.address?.pincode || 'Not provided'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Car className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Vehicle Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Vehicle Type</label>
              {isEditing ? (
                <select
                  value={editData.vehicleDetails?.vehicleType || ''}
                  onChange={(e) => updateEditData('vehicleDetails.vehicleType', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-bold"
                >
                  <option value="">Select type</option>
                  <option value="bike">Bike</option>
                  <option value="scooter">Scooter</option>
                  <option value="bicycle">Bicycle</option>
                  <option value="car">Car</option>
                </select>
              ) : (
                <p className="text-gray-900 font-bold py-3 capitalize">{profile.vehicleDetails?.vehicleType || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Vehicle Number</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.vehicleDetails?.vehicleNumber || ''}
                  onChange={(e) => updateEditData('vehicleDetails.vehicleNumber', e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-bold"
                />
              ) : (
                <p className="text-gray-900 font-bold py-3">{profile.vehicleDetails?.vehicleNumber || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">License Number</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.vehicleDetails?.licenseNumber || ''}
                  onChange={(e) => updateEditData('vehicleDetails.licenseNumber', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-bold"
                />
              ) : (
                <p className="text-gray-900 font-bold py-3">{profile.vehicleDetails?.licenseNumber || 'Not provided'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Bank Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Bank Information</h2>
            </div>
            
            {!isEditing && (
              <button
                onClick={() => setShowBankDetails(!showBankDetails)}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-bold text-gray-700"
              >
                {showBankDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showBankDetails ? 'Hide' : 'Show'}
              </button>
            )}
          </div>

          {(isEditing || showBankDetails) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Account Holder Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.bankDetails?.accountHolderName || ''}
                    onChange={(e) => updateEditData('bankDetails.accountHolderName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-bold"
                  />
                ) : (
                  <p className="text-gray-900 font-bold py-3">{profile.bankDetails?.accountHolderName || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Account Number</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.bankDetails?.accountNumber || ''}
                    onChange={(e) => updateEditData('bankDetails.accountNumber', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-bold"
                  />
                ) : (
                  <p className="text-gray-900 font-bold py-3">
                    {profile.bankDetails?.accountNumber ? `****${profile.bankDetails.accountNumber.slice(-4)}` : 'Not provided'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">IFSC Code</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.bankDetails?.ifscCode || ''}
                    onChange={(e) => updateEditData('bankDetails.ifscCode', e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-bold"
                  />
                ) : (
                  <p className="text-gray-900 font-bold py-3">{profile.bankDetails?.ifscCode || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Bank Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.bankDetails?.bankName || ''}
                    onChange={(e) => updateEditData('bankDetails.bankName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-bold"
                  />
                ) : (
                  <p className="text-gray-900 font-bold py-3">{profile.bankDetails?.bankName || 'Not provided'}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Working Hours */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Working Hours</h2>
          </div>

          <div className="space-y-4">
            {(profile.workingHours || []).map((hour, index) => (
              <div key={hour.day} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                <div className="w-20">
                  <span className="font-bold text-gray-900 capitalize">{hour.day}</span>
                </div>
                
                {isEditing ? (
                  <>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editData.workingHours?.[index]?.isWorking ?? hour.isWorking}
                        onChange={(e) => updateWorkingHour(index, 'isWorking', e.target.checked)}
                        className="text-blue-600 rounded"
                      />
                      <span className="font-bold text-gray-700">Working</span>
                    </label>
                    
                    {(editData.workingHours?.[index]?.isWorking ?? hour.isWorking) && (
                      <>
                        <input
                          type="time"
                          value={editData.workingHours?.[index]?.startTime ?? hour.startTime}
                          onChange={(e) => updateWorkingHour(index, 'startTime', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-bold"
                        />
                        <span className="font-bold text-gray-500">to</span>
                        <input
                          type="time"
                          value={editData.workingHours?.[index]?.endTime ?? hour.endTime}
                          onChange={(e) => updateWorkingHour(index, 'endTime', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-bold"
                        />
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      hour.isWorking ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {hour.isWorking ? 'Working' : 'Off'}
                    </span>
                    
                    {hour.isWorking && (
                      <span className="font-bold text-gray-700">
                        {hour.startTime} to {hour.endTime}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Zones */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Delivery Zones</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {(profile.deliveryZones || []).map((zone, index) => (
              <span
                key={index}
                className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg font-bold text-sm"
              >
                {zone}
              </span>
            ))}
            
            {(!profile.deliveryZones || profile.deliveryZones.length === 0) && (
              <p className="text-gray-500 font-medium italic">No delivery zones configured</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
