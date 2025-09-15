'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Store, MapPin, Phone, Building, Save, Hash } from 'lucide-react';
import ImageUpload from '@/components/common/ImageUpload';
// Add this import and component in the edit profile page
import Breadcrumb from '@/components/common/Breadcrumb';

const schema = yup.object({
  restaurantName: yup.string().required('Restaurant name is required').min(2, 'Restaurant name must be at least 2 characters'),
  pincode: yup.string().required('Pincode is required').matches(/^[0-9]{6}$/, 'Pincode must be 6 digits'), // Added pincode validation
  city: yup.string().required('City is required'),
  state: yup.string().required('State is required'), // Added state
  mobileNo: yup.string().required('Mobile number is required').matches(/^[0-9]{10}$/, 'Mobile number must be 10 digits'),
  fullAddress: yup.string().required('Full address is required').min(10, 'Please provide a complete address'),
  deliveryPincodes: yup.string(), // Optional delivery areas
});

export default function EditProfile() {
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [restaurantPhoto, setRestaurantPhoto] = useState(null);
  const [photoPublicId, setPhotoPublicId] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [pincodeInfo, setPincodeInfo] = useState(null); // For pincode validation
  const [isValidatingPincode, setIsValidatingPincode] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm({
    resolver: yupResolver(schema)
  });

  const watchedPincode = watch('pincode');

  useEffect(() => {
    getCurrentUserAndProfile();
  }, []);

  // Validate pincode when it changes
  useEffect(() => {
    if (watchedPincode && watchedPincode.length === 6) {
      validatePincode(watchedPincode);
    } else {
      setPincodeInfo(null);
    }
  }, [watchedPincode]);

  const validatePincode = async (pincode) => {
    setIsValidatingPincode(true);
    try {
      // You can integrate with a real pincode API here
      // For now, using a simple city mapping
      const pincodeMap = {
        '125001': { city: 'Hisar', state: 'Haryana', district: 'Hisar' },
        '125004': { city: 'Hisar', state: 'Haryana', district: 'Hisar' },
        '110001': { city: 'Delhi', state: 'Delhi', district: 'Central Delhi' },
        '400001': { city: 'Mumbai', state: 'Maharashtra', district: 'Mumbai City' },
        '560001': { city: 'Bangalore', state: 'Karnataka', district: 'Bangalore Urban' },
        '122001': { city: 'Gurgaon', state: 'Haryana', district: 'Gurgaon' },
        '201301': { city: 'Noida', state: 'Uttar Pradesh', district: 'Gautam Buddha Nagar' },
      };

      const info = pincodeMap[pincode];
      if (info) {
        setPincodeInfo(info);
        // Auto-fill city and state
        setValue('city', info.city);
        setValue('state', info.state);
        toast.success(`Pincode verified: ${info.city}, ${info.state}`);
      } else {
        setPincodeInfo(null);
        toast.error('Pincode not found. Please verify the pincode.');
      }
    } catch (error) {
      console.error('Error validating pincode:', error);
      setPincodeInfo(null);
    } finally {
      setIsValidatingPincode(false);
    }
  };

  const getCurrentUserAndProfile = async () => {
    try {
      // Get current user
      const userResponse = await fetch('/api/auth/me');
      if (!userResponse.ok) {
        toast.error('Please login to access this page');
        router.push('/login');
        return;
      }

      const userData = await userResponse.json();
      if (userData.user.role !== 'vendor') {
        toast.error('Access denied. Vendor role required.');
        router.push('/login');
        return;
      }

      setUserId(userData.user.id);

      // Get vendor profile
      const profileResponse = await fetch(`/api/vendor/profile?userId=${userData.user.id}`);
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setCurrentProfile(profileData.profile);

        // Pre-fill form with current data
        setValue('restaurantName', profileData.profile.restaurantName);
        setValue('pincode', profileData.profile.pincode || ''); // Added pincode
        setValue('city', profileData.profile.city);
        setValue('state', profileData.profile.state || ''); // Added state
        setValue('mobileNo', profileData.profile.mobileNo);
        setValue('fullAddress', profileData.profile.fullAddress);
        setValue('deliveryPincodes', profileData.profile.deliveryPincodes?.join(', ') || ''); // Added delivery areas

        if (profileData.profile.restaurantPhoto) {
          setRestaurantPhoto(profileData.profile.restaurantPhoto);
        }
      } else {
        toast.error('Profile not found');
        router.push('/dashboard/vendor');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Error loading profile');
    } finally {
      setIsPageLoading(false);
    }
  };

  const handleImageUpload = (imageUrl, publicId) => {
    setRestaurantPhoto(imageUrl);
    setPhotoPublicId(publicId);
  };

  const handleImageRemove = async () => {
    if (photoPublicId) {
      try {
        await fetch(`/api/upload/image?publicId=${photoPublicId}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }
    setRestaurantPhoto(null);
    setPhotoPublicId(null);
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Process delivery pincodes
      const deliveryPincodesArray = data.deliveryPincodes 
        ? data.deliveryPincodes.split(',').map(p => p.trim()).filter(p => p.length === 6)
        : [];

      const response = await fetch('/api/vendor/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          restaurantName: data.restaurantName,
          restaurantPhoto: restaurantPhoto,
          pincode: data.pincode, // Added pincode
          city: data.city,
          state: data.state, // Added state
          mobileNo: data.mobileNo,
          fullAddress: data.fullAddress,
          deliveryPincodes: deliveryPincodesArray, // Added delivery areas
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Profile updated successfully!');
        router.push('/dashboard/vendor');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/vendor');
  };

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <Breadcrumb
          items={[
            { label: 'Profile', href: null }
          ]}
        />
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleCancel}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Restaurant Profile</h1>
          <p className="text-gray-600 mt-2">Update your restaurant information</p>
        </div>

        {/* Form */}
        <div className="bg-white shadow rounded-lg">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Restaurant Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Restaurant Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Store className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('restaurantName')}
                      type="text"
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900 placeholder-gray-500 ${errors.restaurantName ? 'border-red-300' : 'border-gray-300'
                        }`}
                      placeholder="Enter restaurant name"
                    />
                  </div>
                  {errors.restaurantName && (
                    <p className="mt-1 text-sm text-red-600">{errors.restaurantName.message}</p>
                  )}
                </div>

                {/* Pincode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pincode <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Hash className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('pincode')}
                      type="text"
                      maxLength="6"
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900 placeholder-gray-500 ${errors.pincode ? 'border-red-300' : 'border-gray-300'
                        }`}
                      placeholder="Enter 6-digit pincode"
                    />
                    {isValidatingPincode && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                      </div>
                    )}
                  </div>
                  {errors.pincode && (
                    <p className="mt-1 text-sm text-red-600">{errors.pincode.message}</p>
                  )}
                  {pincodeInfo && (
                    <p className="mt-1 text-sm text-green-600">
                      ✓ {pincodeInfo.city}, {pincodeInfo.state} - {pincodeInfo.district}
                    </p>
                  )}
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('city')}
                      type="text"
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900 placeholder-gray-500 ${errors.city ? 'border-red-300' : 'border-gray-300'
                        }`}
                      placeholder="Enter city"
                      readOnly={pincodeInfo !== null}
                    />
                  </div>
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                  )}
                </div>

                {/* State */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('state')}
                      type="text"
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900 placeholder-gray-500 ${errors.state ? 'border-red-300' : 'border-gray-300'
                        }`}
                      placeholder="Enter state"
                      readOnly={pincodeInfo !== null}
                    />
                  </div>
                  {errors.state && (
                    <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
                  )}
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('mobileNo')}
                      type="tel"
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900 placeholder-gray-500 ${errors.mobileNo ? 'border-red-300' : 'border-gray-300'
                        }`}
                      placeholder="Enter 10-digit mobile number"
                    />
                  </div>
                  {errors.mobileNo && (
                    <p className="mt-1 text-sm text-red-600">{errors.mobileNo.message}</p>
                  )}
                </div>

                {/* Full Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Address
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-0 pl-3 pointer-events-none">
                      <Building className="h-5 w-5 text-gray-400" />
                    </div>
                    <textarea
                      {...register('fullAddress')}
                      rows={4}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900 placeholder-gray-500 ${errors.fullAddress ? 'border-red-300' : 'border-gray-300'
                        }`}
                      placeholder="Enter complete restaurant address"
                    />
                  </div>
                  {errors.fullAddress && (
                    <p className="mt-1 text-sm text-red-600">{errors.fullAddress.message}</p>
                  )}
                </div>

                {/* Delivery Areas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Pincodes <span className="text-gray-500">(Optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Hash className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('deliveryPincodes')}
                      type="text"
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900 placeholder-gray-500"
                      placeholder="125001, 125004, 125005 (comma separated)"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Enter additional pincodes where you deliver (separated by commas)
                  </p>
                </div>
              </div>

              {/* Right Column - Restaurant Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restaurant Photo
                </label>
                <ImageUpload
                  onImageUpload={handleImageUpload}
                  currentImage={restaurantPhoto}
                  onImageRemove={handleImageRemove}
                  maxSizeMB={5}
                  className="h-64"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Upload a high-quality photo of your restaurant. Recommended size: 800x600px
                </p>
              </div>
            </div>

            {/* Current vs New Comparison */}
            {currentProfile && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Current Information</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Restaurant:</span>
                      <span className="ml-2 text-gray-600">{currentProfile.restaurantName}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Pincode:</span>
                      <span className="ml-2 text-gray-600">{currentProfile.pincode || 'Not set'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">City:</span>
                      <span className="ml-2 text-gray-600">{currentProfile.city}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Mobile:</span>
                      <span className="ml-2 text-gray-600">{currentProfile.mobileNo}</span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-700">Delivery Areas:</span>
                      <span className="ml-2 text-gray-600">
                        {currentProfile.deliveryPincodes?.join(', ') || 'Same pincode only'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Last Updated:</span>
                      <span className="ml-2 text-gray-600">
                        {new Date(currentProfile.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isLoading}
                className="px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </div>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Profile
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
