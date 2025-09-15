// app/dashboard/delivery-partner/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Truck, 
  Package, 
  DollarSign, 
  Star, 
  Clock, 
  MapPin, 
  Phone, 
  CheckCircle,
  AlertCircle,
  ArrowRight,
  User,
  Calendar,
  TrendingUp,
  Activity,
  Settings,
  LogOut
} from 'lucide-react';

export default function DeliveryPartnerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    partner: {},
    stats: {},
    currentOrders: {},
    recentOrders: []
  });
  const [activeOrders, setActiveOrders] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const [isAvailable, setIsAvailable] = useState(false); // ✅ Changed to isAvailable

  useEffect(() => {
    fetchDashboardData();
  }, []); // ✅ Removed location check

  // ✅ Updated fetchDashboardData
  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/delivery-partner/dashboard');
      const data = await response.json();
      
      if (data.success) {
        setDashboardData(data);
        setIsAvailable(data.partner.isAvailable); // ✅ Changed to isAvailable
        
        if (data.partner.profileCompletion && data.partner.profileCompletion.percentage < 50) {
          console.log('Profile completion too low, redirecting to complete profile...');
          router.push('/dashboard/delivery-partner/complete-profile');
          return;
        }
      } else {
        console.error('Failed to fetch dashboard data:', data.error);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (type) => {
    try {
      const response = await fetch(`/api/delivery-partner/orders?type=${type}`);
      const data = await response.json();
      
      if (data.success) {
        if (type === 'active') {
          setActiveOrders(data.orders);
        } else if (type === 'available') {
          setAvailableOrders(data.orders);
        }
      }
    } catch (error) {
      console.error(`Error fetching ${type} orders:`, error);
    }
  };

  // ✅ Simplified toggle function - no location logic
  const toggleAvailability = async () => {
    try {
      const response = await fetch('/api/delivery-partner/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isAvailable: !isAvailable
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setIsAvailable(data.isAvailable);
        
        if (data.isAvailable) {
          fetchOrders('available');
        }
        
        console.log(`Availability updated to: ${data.isAvailable ? 'Available' : 'Unavailable'}`);
      } else {
        alert(data.error || 'Failed to update availability');
      }
    } catch (error) {
      console.error('Error toggling availability:', error);
      alert('Failed to update availability');
    }
  };

  // ✅ Simplified handleOrderAction - no location logic
  const handleOrderAction = async (orderId, action, reason = '') => {
    try {
      const response = await fetch(`/api/delivery-partner/orders/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, reason })
      });

      const data = await response.json();
      
      if (data.success) {
        fetchDashboardData();
        if (selectedTab === 'orders') {
          fetchOrders('active');
          fetchOrders('available');
        }
        
        alert(data.message);
      } else {
        alert(data.error || 'Action failed');
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      alert('Action failed');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-yellow-100 text-yellow-800';
      case 'picked_up': return 'bg-purple-100 text-purple-800';
      case 'out_for_delivery': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      try {
        if (isAvailable) {
          await fetch('/api/delivery-partner/availability', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isAvailable: false })
          });
        }
        
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
      } catch (error) {
        console.error('Error logging out:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-bold">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Truck className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Delivery Dashboard</h1>
                  <p className="text-sm font-medium text-gray-600">Welcome, {dashboardData.partner.name}!</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Profile Completion Indicator */}
              {dashboardData.partner.profileCompletion && (
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    dashboardData.partner.profileCompletion.percentage === 100 ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                  <span className="text-sm font-bold text-gray-700">
                    Profile: {dashboardData.partner.profileCompletion.percentage}%
                  </span>
                </div>
              )}

              {/* ✅ UPDATED: Simple Availability Toggle Switch */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-700">Available</span>
                <button
                  onClick={toggleAvailability}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isAvailable ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isAvailable ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span className={`text-xs font-bold ${isAvailable ? 'text-green-600' : 'text-gray-500'}`}>
                    {isAvailable ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>

              {/* Profile & Logout */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push('/dashboard/delivery-partner/profile')}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                  title="View Profile"
                >
                  <User className="w-5 h-5" />
                </button>
                
                <button
                  onClick={() => router.push('/dashboard/delivery-partner/complete-profile')}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                  title="Edit Profile"
                >
                  <Settings className="w-5 h-5" />
                </button>
                
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-6 mt-4">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Activity },
              { id: 'orders', label: 'Orders', icon: Package },
              { id: 'earnings', label: 'Earnings', icon: DollarSign }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setSelectedTab(id);
                  if (id === 'orders') {
                    fetchOrders('active');
                    fetchOrders('available');
                  }
                }}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-bold text-sm transition-colors ${
                  selectedTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Dashboard Tab */}
        {selectedTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-600">Today's Deliveries</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.today?.deliveries || 0}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-600">Today's Earnings</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(dashboardData.stats.today?.earnings || 0)}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-600">Available Orders</p>
                    <p className="text-2xl font-bold text-orange-600">{dashboardData.currentOrders.available || 0}</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-600">Rating</p>
                    <div className="flex items-center gap-1">
                      <p className="text-2xl font-bold text-yellow-600">{dashboardData.partner.rating?.toFixed(1) || '0.0'}</p>
                      <Star className="w-5 h-5 text-yellow-500 fill-current" />
                    </div>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Star className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* ✅ UPDATED: Status Alert - simplified */}
            <div className={`p-4 rounded-xl border-2 ${
              isAvailable 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center gap-3">
                {isAvailable ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                )}
                <div className="flex-1">
                  <h3 className={`font-bold ${isAvailable ? 'text-green-800' : 'text-yellow-800'}`}>
                    {isAvailable ? 'You are Available!' : 'You are Unavailable'}
                  </h3>
                  <p className={`text-sm ${isAvailable ? 'text-green-700' : 'text-yellow-700'}`}>
                    {isAvailable 
                      ? 'You can receive delivery orders now from restaurants.'
                      : 'Toggle availability to start receiving delivery orders.'
                    }
                  </p>
                </div>
                {!isAvailable && (
                  <button
                    onClick={toggleAvailability}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-bold"
                  >
                    Go Available
                  </button>
                )}
              </div>
            </div>

            {/* Profile Completion Warning */}
            {dashboardData.partner.profileCompletion && dashboardData.partner.profileCompletion.percentage < 100 && (
              <div className="p-4 rounded-xl border-2 bg-yellow-50 border-yellow-200">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                  <div className="flex-1">
                    <h3 className="font-bold text-yellow-800">Complete Your Profile</h3>
                    <p className="text-sm text-yellow-700 mb-2">
                      Your profile is {dashboardData.partner.profileCompletion.percentage}% complete. 
                      Complete it to receive more delivery orders and get verified.
                    </p>
                    {dashboardData.partner.profileCompletion.missingFields && (
                      <p className="text-xs text-yellow-600">
                        Missing: {dashboardData.partner.profileCompletion.missingFields.slice(0, 3).join(', ')}
                        {dashboardData.partner.profileCompletion.missingFields.length > 3 && ` and ${dashboardData.partner.profileCompletion.missingFields.length - 3} more`}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => router.push('/dashboard/delivery-partner/complete-profile')}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 font-bold"
                  >
                    Complete Profile
                  </button>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Active Orders</h3>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {dashboardData.currentOrders.active || 0}
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-4">Orders in progress</p>
                  <button
                    onClick={() => {
                      setSelectedTab('orders');
                      fetchOrders('active');
                    }}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-bold"
                  >
                    View Orders
                  </button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">This Week</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Deliveries:</span>
                    <span className="font-bold text-gray-900">{dashboardData.stats.weekly?.deliveries || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Earnings:</span>
                    <span className="font-bold text-green-600">{formatCurrency(dashboardData.stats.weekly?.earnings || 0)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">All Time Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Total Deliveries:</span>
                    <span className="font-bold text-gray-900">{dashboardData.stats.allTime?.deliveries || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Total Earnings:</span>
                    <span className="font-bold text-green-600">{formatCurrency(dashboardData.stats.allTime?.earnings || 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            {dashboardData.recentOrders?.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Recent Orders</h3>
                  <button
                    onClick={() => setSelectedTab('orders')}
                    className="text-blue-600 hover:text-blue-700 font-bold text-sm flex items-center gap-1"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {dashboardData.recentOrders.slice(0, 3).map((order) => (
                    <div key={order._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">#{order.orderNumber}</p>
                          <p className="text-sm font-medium text-gray-600">
                            {order.restaurantDetails.name} • {formatCurrency(order.deliveryDetails?.partnerEarnings || 0)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                          {order.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <p className="text-xs font-medium text-gray-500 mt-1">{formatTime(order.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {selectedTab === 'orders' && (
          <div className="space-y-6">
            
            {/* Order Type Filter */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex gap-4 overflow-x-auto">
                <button
                  onClick={() => fetchOrders('available')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 font-bold whitespace-nowrap"
                >
                  <Clock className="w-4 h-4" />
                  <span>Available Orders ({dashboardData.currentOrders.available || 0})</span>
                </button>
                
                <button
                  onClick={() => fetchOrders('assigned')}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 font-bold whitespace-nowrap"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Assigned ({dashboardData.currentOrders.assigned || 0})</span>
                </button>
                
                <button
                  onClick={() => fetchOrders('active')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 font-bold whitespace-nowrap"
                >
                  <Truck className="w-4 h-4" />
                  <span>Active Orders ({dashboardData.currentOrders.active || 0})</span>
                </button>
              </div>
            </div>

            {/* Available Orders */}
            {availableOrders.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Available Orders Near You</h3>
                <div className="space-y-4">
                  {availableOrders.map((order) => (
                    <div key={order._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-bold text-gray-900">#{order.orderNumber}</h4>
                          <p className="text-sm font-medium text-gray-600">{order.restaurantDetails.name}</p>
                          <p className="text-sm font-medium text-gray-500">{order.restaurantDetails.address}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">{formatCurrency(order.deliveryDetails?.partnerEarnings || 25)}</div>
                          <p className="text-xs font-medium text-gray-500">{formatTime(order.readyAt || order.createdAt)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-4 text-sm font-medium text-gray-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>Delivery Fee</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>Est: 15 min</span>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleOrderAction(order._id, 'accept')}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-bold"
                        >
                          Accept Order
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Orders */}
            {activeOrders.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Your Active Orders</h3>
                <div className="space-y-4">
                  {activeOrders.map((order) => (
                    <div key={order._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-bold text-gray-900">#{order.orderNumber}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                              {order.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-600">{order.restaurantDetails.name}</p>
                          <p className="text-sm font-medium text-gray-600">Customer: {order.customerDetails.name}</p>
                          <p className="text-sm font-medium text-gray-500">{order.customerDetails.phone}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">{formatCurrency(order.deliveryDetails?.partnerEarnings || 25)}</div>
                          <p className="text-xs font-medium text-gray-500">Items: {order.items.length}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="text-sm font-medium text-gray-600">
                          <MapPin className="w-4 h-4 inline mr-1" />
                          Pickup: {order.restaurantDetails.address}
                        </div>
                        <div className="text-sm font-medium text-gray-600">
                          <MapPin className="w-4 h-4 inline mr-1" />
                          Delivery: {order.customerDetails.address}
                        </div>
                      </div>
                      
                      <div className="flex gap-3 pt-4 border-t border-gray-200">
                        {order.status === 'assigned' && (
                          <>
                            <button
                              onClick={() => handleOrderAction(order._id, 'accept')}
                              className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-bold"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Reason for rejection (optional):');
                                handleOrderAction(order._id, 'reject', reason || 'Not specified');
                              }}
                              className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 font-bold"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        
                        {order.status === 'accepted' && (
                          <button
                            onClick={() => handleOrderAction(order._id, 'pickup')}
                            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-bold"
                          >
                            Mark as Picked Up
                          </button>
                        )}
                        
                        {order.status === 'picked_up' && (
                          <button
                            onClick={() => handleOrderAction(order._id, 'start_delivery')}
                            className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 font-bold"
                          >
                            Start Delivery
                          </button>
                        )}
                        
                        {order.status === 'out_for_delivery' && (
                          <button
                            onClick={() => handleOrderAction(order._id, 'deliver')}
                            className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-bold"
                          >
                            Mark as Delivered
                          </button>
                        )}
                        
                        <a
                          href={`tel:${order.customerDetails.phone}`}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-bold text-gray-700 flex items-center gap-1"
                        >
                          <Phone className="w-4 h-4" />
                          Call
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Orders Message */}
            {availableOrders.length === 0 && activeOrders.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Orders Available</h3>
                <p className="text-gray-600 font-medium mb-6">
                  {isAvailable 
                    ? 'New orders will appear here when restaurants assign them to you.'
                    : 'Make yourself available to start receiving delivery orders.'
                  }
                </p>
                {!isAvailable && (
                  <button
                    onClick={toggleAvailability}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-bold"
                  >
                    Go Available
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Earnings Tab */}
        {selectedTab === 'earnings' && (
          <div className="space-y-6">
            
            {/* Earnings Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Today's Earnings</h3>
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {formatCurrency(dashboardData.stats.today?.earnings || 0)}
                </div>
                <p className="text-sm font-medium text-gray-600">
                  From {dashboardData.stats.today?.deliveries || 0} deliveries
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">This Week</h3>
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {formatCurrency(dashboardData.stats.weekly?.earnings || 0)}
                </div>
                <p className="text-sm font-medium text-gray-600">
                  From {dashboardData.stats.weekly?.deliveries || 0} deliveries
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">All Time</h3>
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {formatCurrency(dashboardData.stats.allTime?.earnings || 0)}
                </div>
                <p className="text-sm font-medium text-gray-600">
                  From {dashboardData.stats.allTime?.deliveries || 0} deliveries
                </p>
              </div>
            </div>

            {/* Earnings Breakdown */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Earnings Breakdown</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="font-medium text-gray-700">Average per delivery</span>
                  <span className="font-bold text-gray-900">
                    {dashboardData.stats.allTime?.deliveries > 0 
                      ? formatCurrency((dashboardData.stats.allTime.earnings / dashboardData.stats.allTime.deliveries)) 
                      : formatCurrency(0)
                    }
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="font-medium text-gray-700">Total completed deliveries</span>
                  <span className="font-bold text-gray-900">{dashboardData.stats.allTime?.deliveries || 0}</span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="font-medium text-gray-700">Success rate</span>
                  <span className="font-bold text-green-600">
                    {dashboardData.stats.allTime?.deliveries > 0 ? '98%' : '0%'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-3">
                  <span className="font-medium text-gray-700">Customer rating</span>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-yellow-600">{dashboardData.partner.rating?.toFixed(1) || '0.0'}</span>
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
