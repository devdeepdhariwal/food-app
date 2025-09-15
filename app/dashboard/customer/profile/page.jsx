// app/dashboard/customer/profile/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Home, 
  Briefcase, 
  MapPinIcon,
  Phone,
  Mail,
  Calendar,
  Users,
  Settings,
  Shield,
  Heart,
  Clock,
  Check,
  X,
  ArrowLeft
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [profile, setProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [activeTab, setActiveTab] = useState('personal');
  const [editingPersonal, setEditingPersonal] = useState(false);

  // Personal info edit state
  const [editPersonalInfo, setEditPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    gender: ''
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      // Fetch profile
      const profileResponse = await fetch('/api/profile/me');
      const profileData = await profileResponse.json();
      
      if (profileData.success) {
        setProfile(profileData.profile);
        setEditPersonalInfo({
          firstName: profileData.profile.personalInfo?.firstName || '',
          lastName: profileData.profile.personalInfo?.lastName || '',
          phone: profileData.profile.personalInfo?.phone || '',
          dateOfBirth: profileData.profile.personalInfo?.dateOfBirth ? 
            new Date(profileData.profile.personalInfo.dateOfBirth).toISOString().split('T')[0] : '',
          gender: profileData.profile.personalInfo?.gender || ''
        });
      }

      // Fetch addresses
      const addressResponse = await fetch('/api/profile/addresses');
      const addressData = await addressResponse.json();
      
      if (addressData.success) {
        setAddresses(addressData.addresses);
      }

    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePersonalInfoUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const response = await fetch('/api/profile/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personalInfo: editPersonalInfo })
      });

      const data = await response.json();
      
      if (data.success) {
        setProfile(data.profile);
        setEditingPersonal(false);
        alert('Profile updated successfully!');
      } else {
        alert('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      const response = await fetch(`/api/profile/addresses/${addressId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        setAddresses(prev => prev.filter(addr => addr.id !== addressId));
        alert('Address deleted successfully');
      } else {
        alert('Failed to delete address');
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      alert('Failed to delete address');
    }
  };

  const getAddressIcon = (type) => {
    switch (type) {
      case 'home': return <Home className="w-5 h-5" />;
      case 'work': return <Briefcase className="w-5 h-5" />;
      default: return <MapPinIcon className="w-5 h-5" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Home</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <div className="w-24"></div> {/* Spacer */}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-orange-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {profile?.personalInfo?.firstName} {profile?.personalInfo?.lastName}
              </h2>
              <p className="text-gray-600 flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4" />
                {profile?.personalInfo?.email}
              </p>
              <p className="text-gray-600 flex items-center gap-2 mt-1">
                <Phone className="w-4 h-4" />
                {profile?.personalInfo?.phone || 'Phone not added'}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${profile?.profileCompletion?.isComplete ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="text-sm font-medium">
                  {profile?.profileCompletion?.isComplete ? 'Profile Complete' : 'Profile Incomplete'}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Member since {formatDate(profile?.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {[
                { id: 'personal', label: 'Personal Info', icon: User },
                { id: 'addresses', label: 'Addresses', icon: MapPin },
                { id: 'preferences', label: 'Preferences', icon: Heart },
                { id: 'security', label: 'Security', icon: Shield }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          
          {/* Personal Information Tab */}
          {activeTab === 'personal' && (
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Personal Information</h3>
                <button
                  onClick={() => setEditingPersonal(!editingPersonal)}
                  className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium"
                >
                  {editingPersonal ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                  {editingPersonal ? 'Cancel' : 'Edit'}
                </button>
              </div>

              {editingPersonal ? (
                <form onSubmit={handlePersonalInfoUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={editPersonalInfo.firstName}
                        onChange={(e) => setEditPersonalInfo(prev => ({ ...prev, firstName: e.target.value }))}
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
                        value={editPersonalInfo.lastName}
                        onChange={(e) => setEditPersonalInfo(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 font-bold placeholder-gray-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={editPersonalInfo.phone}
                      onChange={(e) => setEditPersonalInfo(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 font-bold placeholder-gray-500"
                      placeholder="+91 9876543210"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={editPersonalInfo.dateOfBirth}
                        onChange={(e) => setEditPersonalInfo(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gender
                      </label>
                      <select
                        value={editPersonalInfo.gender}
                        onChange={(e) => setEditPersonalInfo(prev => ({ ...prev, gender: e.target.value }))}
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

                  <div className="flex gap-4">
                    <button
                      type="submit"
                      disabled={updating}
                      className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                      {updating ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Full Name</label>
                      <p className="text-lg text-gray-900 font-medium">
                        {profile?.personalInfo?.firstName} {profile?.personalInfo?.lastName}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">Email Address</label>
                      <p className="text-lg text-gray-900 font-medium">
                        {profile?.personalInfo?.email}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone Number</label>
                      <p className="text-lg text-gray-900 font-medium">
                        {profile?.personalInfo?.phone || 'Not provided'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                      <p className="text-lg text-gray-900 font-medium">
                        {formatDate(profile?.personalInfo?.dateOfBirth)}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">Gender</label>
                      <p className="text-lg text-gray-900 font-medium capitalize">
                        {profile?.personalInfo?.gender || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Addresses Tab */}
          {activeTab === 'addresses' && (
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Saved Addresses</h3>
                <button
                  onClick={() => router.push('/dashboard/customer/add-address')}
                  className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add New Address
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No addresses saved</h4>
                  <p className="text-gray-600 mb-6">Add your first address for faster checkout</p>
                  <button
                    onClick={() => router.push('/dashboard/customer/add-address')}
                    className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 font-medium"
                  >
                    Add Address
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <div key={address.id} className="border border-gray-200 rounded-xl p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                            {getAddressIcon(address.type)}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-bold text-gray-900">{address.label}</h4>
                              {address.isDefault && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                  Default
                                </span>
                              )}
                            </div>
                            
                            <p className="text-gray-700 leading-relaxed">
                              {address.addressLine1}
                              {address.addressLine2 && `, ${address.addressLine2}`}
                              {address.landmark && ` (Near ${address.landmark})`}
                              <br />
                              {address.city}, {address.state} - {address.pincode}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => router.push(`/dashboard/customer/edit-address/${address.id}`)}
                            className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(address.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Food Preferences</h3>
                <button className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium">
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Dietary Restrictions</h4>
                  <div className="space-y-2">
                    {['Vegetarian', 'Vegan', 'Gluten Free', 'Dairy Free'].map(item => (
                      <label key={item} className="flex items-center gap-3">
                        <input type="checkbox" className="text-orange-600 rounded" />
                        <span className="text-gray-700 font-medium">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Favorite Cuisines</h4>
                  <div className="space-y-2">
                    {['Indian', 'Chinese', 'Italian', 'Mexican'].map(item => (
                      <label key={item} className="flex items-center gap-3">
                        <input type="checkbox" className="text-orange-600 rounded" />
                        <span className="text-gray-700 font-medium">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h4 className="font-medium text-gray-900 mb-3">Spice Level</h4>
                <div className="flex gap-4">
                  {['Mild', 'Medium', 'Hot', 'Extra Hot'].map(level => (
                    <label key={level} className="flex items-center gap-2">
                      <input type="radio" name="spice" className="text-orange-600" />
                      <span className="text-gray-700 font-medium">{level}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Account Security</h3>
              
              <div className="space-y-6">
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Password</h4>
                      <p className="text-sm text-gray-600">Last updated 3 months ago</p>
                    </div>
                    <button className="text-orange-600 hover:text-orange-700 font-medium">
                      Change Password
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                      <p className="text-sm text-gray-600">Add an extra layer of security</p>
                    </div>
                    <button className="text-orange-600 hover:text-orange-700 font-medium">
                      Enable
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Login Sessions</h4>
                      <p className="text-sm text-gray-600">Manage your active sessions</p>
                    </div>
                    <button className="text-orange-600 hover:text-orange-700 font-medium">
                      View All
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
