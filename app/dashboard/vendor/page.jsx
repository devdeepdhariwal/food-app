'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProfileModal from '@/components/vendor/ProfileModal';
import { 
  Store, 
  Users, 
  TrendingUp, 
  DollarSign, 
  LogOut, 
  User, 
  Power, 
  Clock, 
  AlertCircle,
  Truck,
  UserCheck,
  Bell
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function VendorDashboard() {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [vendorProfile, setVendorProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState(null);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  
  // ✅ ADDED: Dashboard stats
  const [dashboardStats, setDashboardStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    activeOrders: 0,
    menuItems: 0,
    pendingDeliveryPartners: 0
  });
  
  // Restaurant status states
  const [isOpen, setIsOpen] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closureReason, setClosureReason] = useState('');
  const [workingHours, setWorkingHours] = useState('9:00 AM - 10:00 PM');
  
  const router = useRouter();

  useEffect(() => {
    getCurrentUser();

    // Auto-refresh data every minute
    const interval = setInterval(() => {
      if (userId) {
        fetchDashboardStats();
        fetchNewOrdersCount();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [userId]);

  const getCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me');

      if (response.ok) {
        const result = await response.json();

        if (result.user.role !== 'vendor') {
          toast.error('Access denied. Vendor role required.');
          router.push('/login');
          return;
        }

        setUser(result.user);
        setUserId(result.user.id);
        checkProfileCompletion(result.user.id);
        fetchNewOrdersCount();
        fetchDashboardStats(); // ✅ ADDED: Fetch dashboard stats
      } else {
        toast.error('Please login to access dashboard');
        router.push('/login');
      }
    } catch (error) {
      console.error('Error getting current user:', error);
      toast.error('Authentication error. Please login again.');
      router.push('/login');
    }
  };

  const checkProfileCompletion = async (userId) => {
    try {
      const response = await fetch(`/api/vendor/profile?userId=${userId}`);

      if (response.ok) {
        const result = await response.json();
        if (result.profileExists && result.profile.isProfileComplete) {
          setVendorProfile(result.profile);
          
          // Set restaurant status from profile
          setIsOpen(result.profile.isOpen ?? true);
          setClosureReason(result.profile.closureReason || '');
          setWorkingHours(result.profile.workingHours || '9:00 AM - 10:00 PM');
        } else {
          setShowProfileModal(true);
        }
      } else if (response.status === 404) {
        setShowProfileModal(true);
      } else {
        console.error('Error checking profile:', response.status);
        setShowProfileModal(true);
      }
    } catch (error) {
      console.error('Error checking profile:', error);
      setShowProfileModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ UPDATED: Enhanced fetchDashboardStats with better debugging
  const fetchDashboardStats = async () => {
    try {
      console.log('🔄 Fetching dashboard stats...');
      
      // Fetch menu items count
      const menuResponse = await fetch('/api/vendor/menu');
      let menuItemsCount = 0;
      if (menuResponse.ok) {
        const menuData = await menuResponse.json();
        menuItemsCount = menuData.items?.length || 0;
        console.log('📋 Menu items count:', menuItemsCount);
      } else {
        console.log('❌ Failed to fetch menu items:', menuResponse.status);
      }

      // Fetch orders stats
      const ordersResponse = await fetch('/api/vendor/orders/stats');
      let ordersStats = { totalOrders: 0, totalRevenue: 0, activeOrders: 0 };
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        ordersStats = {
          totalOrders: ordersData.totalOrders || 0,
          totalRevenue: ordersData.totalRevenue || 0,
          activeOrders: ordersData.activeOrders || 0
        };
        console.log('📊 Orders stats:', ordersStats);
      } else {
        console.log('❌ Failed to fetch orders stats:', ordersResponse.status);
      }

      // ✅ ENHANCED: Fetch delivery partners count with better debugging
      console.log('🚚 Fetching delivery partners...');
      const deliveryResponse = await fetch('/api/vendor/delivery-partners?status=pending&limit=1');
      let pendingDeliveryPartners = 0;
      
      if (deliveryResponse.ok) {
        const deliveryData = await deliveryResponse.json();
        console.log('🔍 Delivery Partners API Response:', deliveryData);
        
        pendingDeliveryPartners = deliveryData.totalCount || 0;
        
        if (deliveryData.vendorAreas) {
          console.log('📍 Vendor delivery areas:', deliveryData.vendorAreas);
        }
        
        if (deliveryData.debug) {
          console.log('🔧 Debug info:', deliveryData.debug);
        }
        
        console.log('✅ Pending delivery partners found:', pendingDeliveryPartners);
      } else {
        console.log('❌ Failed to fetch delivery partners:', deliveryResponse.status);
        const errorText = await deliveryResponse.text();
        console.log('Error details:', errorText);
      }

      // ✅ UPDATED: Set dashboard stats with logging
      const newStats = {
        menuItems: menuItemsCount,
        ...ordersStats,
        pendingDeliveryPartners
      };
      
      console.log('📈 Setting dashboard stats:', newStats);
      setDashboardStats(newStats);

    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error);
    }
  };

  const fetchNewOrdersCount = async () => {
    try {
      const response = await fetch('/api/vendor/orders?status=placed');
      if (response.ok) {
        const data = await response.json();
        setNewOrdersCount(data.orders?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching new orders count:', error);
    }
  };

  const handleStatusToggle = async () => {
    if (isOpen) {
      // Closing restaurant - show modal for reason
      setShowCloseModal(true);
    } else {
      // Opening restaurant - no modal needed
      await updateRestaurantStatus(true);
    }
  };

  const updateRestaurantStatus = async (status, reason = '') => {
    setStatusLoading(true);
    try {
      const response = await fetch('/api/vendor/toggle-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isOpen: status,
          closureReason: reason
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsOpen(status);
        setClosureReason(status ? '' : reason);
        setShowCloseModal(false);
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update restaurant status');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleProfileComplete = (profile) => {
    setVendorProfile(profile);
    setShowProfileModal(false);
    
    // Set default restaurant status for new profiles
    setIsOpen(profile.isOpen ?? true);
    setWorkingHours(profile.workingHours || '9:00 AM - 10:00 PM');
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Logged out successfully');
        router.push('/login');
      } else {
        toast.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  };

  // ✅ ADDED: Debug function for troubleshooting
  const handleDebugDeliveryPartners = async () => {
    console.log('🔧 Manual debug delivery partners...');
    try {
      const response = await fetch('/api/vendor/delivery-partners?status=pending&limit=10');
      const data = await response.json();
      console.log('🔍 Full delivery partners response:', data);
      
      // Also try to fetch vendor profile directly
      const profileResponse = await fetch('/api/vendor/profile?userId=' + userId);
      const profileData = await profileResponse.json();
      console.log('🏪 Vendor profile data:', profileData);
    } catch (error) {
      console.error('Debug error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => {}}
        userId={userId}
        onProfileComplete={handleProfileComplete}
      />

      {/* Top Navigation */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Food App - Vendor Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* ✅ ADDED: Debug button (remove in production) */}
              <button
                onClick={handleDebugDeliveryPartners}
                className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                title="Debug Delivery Partners"
              >
                Debug
              </button>
              
              <span className="text-sm text-gray-600">
                Welcome, {user?.name}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header with Restaurant Status */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {vendorProfile?.restaurantPhoto && (
                  <img
                    src={vendorProfile.restaurantPhoto}
                    alt="Restaurant"
                    className="h-16 w-16 rounded-lg object-cover mr-4"
                  />
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Welcome to {vendorProfile?.restaurantName || 'Your Restaurant'} Dashboard
                  </h1>
                  <p className="text-gray-600">
                    {vendorProfile?.city && `Located in ${vendorProfile.city}`}
                  </p>
                  <p className="text-sm text-gray-500">
                    Email: {user?.email}
                  </p>
                  {/* ✅ ADDED: Debug info display */}
                  {vendorProfile?.deliveryPincodes && (
                    <p className="text-xs text-blue-600 mt-1">
                      Delivery Areas: {vendorProfile.deliveryPincodes.join(', ')}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => router.push('/dashboard/vendor/profile/edit')}
                className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <User className="h-4 w-4 mr-2" />
                Edit Profile
              </button>
            </div>
          </div>

          {/* Restaurant Status Card */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-4 ${isOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Restaurant {isOpen ? 'Open' : 'Closed'}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>Working Hours: {workingHours}</span>
                  </div>
                  {!isOpen && closureReason && (
                    <p className="text-sm text-red-600 mt-1">Reason: {closureReason}</p>
                  )}
                </div>
              </div>
              
              <button
                onClick={handleStatusToggle}
                disabled={statusLoading}
                className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                  isOpen 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                <Power className="w-5 h-5 mr-2" />
                {statusLoading ? 'Updating...' : isOpen ? 'Close Restaurant' : 'Open Restaurant'}
              </button>
            </div>
          </div>

          {/* ✅ UPDATED: Stats Cards with Real Data and Debug Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-blue-500 rounded-lg p-3">
                  <Store className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalOrders}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-green-500 rounded-lg p-3">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">₹{dashboardStats.totalRevenue}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-orange-500 rounded-lg p-3">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.activeOrders}</p>
                </div>
              </div>
            </div>

            {/* ✅ FIXED: Menu Items Card with Real Count */}
            <div
              onClick={() => router.push('/dashboard/vendor/menu')}
              className="bg-white rounded-lg shadow p-6 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <div className="bg-purple-500 rounded-lg p-3">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Menu Items</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.menuItems}</p>
                </div>
              </div>
            </div>

            {/* ✅ ENHANCED: Delivery Partners Card with Badge and Debug Info */}
            <div
              onClick={() => router.push('/dashboard/vendor/delivery-partners')}
              className="bg-white rounded-lg shadow p-6 cursor-pointer hover:bg-gray-50 transition-colors relative"
            >
              <div className="flex items-center">
                <div className="bg-indigo-500 rounded-lg p-3">
                  <Truck className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Delivery Partners</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.pendingDeliveryPartners}</p>
                  <p className="text-xs text-gray-500">Pending Verification</p>
                </div>
              </div>
              
              {/* ✅ ENHANCED: Badge for unverified delivery partners */}
              {dashboardStats.pendingDeliveryPartners > 0 && (
                <div className="absolute -top-2 -right-2">
                  <div className="flex items-center justify-center w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                    {dashboardStats.pendingDeliveryPartners > 99 ? '99+' : dashboardStats.pendingDeliveryPartners}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ✅ UPDATED: Quick Actions with Delivery Partners */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Add Menu Item Button */}
              <button
                onClick={() => router.push('/dashboard/vendor/menu/add')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
              >
                <h3 className="font-medium text-gray-900">Add Menu Item</h3>
                <p className="text-sm text-gray-600">Add new dishes to your menu</p>
              </button>

              {/* View Orders Button with Badge */}
              <button
                onClick={() => {
                  router.push('/dashboard/vendor/orders');
                  setNewOrdersCount(0); // Reset count when visiting orders page
                }}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors relative"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">View Orders</h3>
                    <p className="text-sm text-gray-600">Check incoming orders</p>
                  </div>
                  {/* New Orders Badge */}
                  {newOrdersCount > 0 && (
                    <div className="flex items-center justify-center w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full">
                      {newOrdersCount > 99 ? '99+' : newOrdersCount}
                    </div>
                  )}
                </div>
              </button>

              {/* ✅ ENHANCED: Delivery Partners Button with Badge */}
              <button
                onClick={() => router.push('/dashboard/vendor/delivery-partners')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors relative"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">Delivery Partners</h3>
                    <p className="text-sm text-gray-600">Verify delivery partners</p>
                  </div>
                  {/* Pending Verification Badge */}
                  {dashboardStats.pendingDeliveryPartners > 0 && (
                    <div className="flex items-center gap-1">
                      <Bell className="w-4 h-4 text-orange-500 animate-bounce" />
                      <div className="flex items-center justify-center w-6 h-6 bg-orange-500 text-white text-xs font-bold rounded-full">
                        {dashboardStats.pendingDeliveryPartners > 99 ? '99+' : dashboardStats.pendingDeliveryPartners}
                      </div>
                    </div>
                  )}
                </div>
              </button>

              {/* Edit Profile Button */}
              <button
                onClick={() => router.push('/dashboard/vendor/profile/edit')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
              >
                <h3 className="font-medium text-gray-900">Edit Profile</h3>
                <p className="text-sm text-gray-600">Update restaurant information</p>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Close Restaurant Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-5 h-5 text-orange-500 mr-2" />
              <h3 className="text-lg font-semibold">Close Restaurant</h3>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for closing (optional)
              </label>
              <input
                type="text"
                value={closureReason}
                onChange={(e) => setClosureReason(e.target.value)}
                placeholder="e.g., Holiday, Break time, Maintenance"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 font-semibold placeholder-gray-500"
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowCloseModal(false);
                  setClosureReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => updateRestaurantStatus(false, closureReason)}
                disabled={statusLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {statusLoading ? 'Closing...' : 'Close Restaurant'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
