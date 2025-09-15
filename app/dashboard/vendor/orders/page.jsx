'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OrderCard from '@/components/vendor/OrderCard';
import { Clock, Package, Truck, CheckCircle, RefreshCw, AlertCircle, Users } from 'lucide-react';
import toast from 'react-hot-toast';

// ✅ UPDATED: Enhanced tabs with new confirmed status
const tabs = [
  {
    id: 'placed',
    label: 'New Orders',
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  {
    id: 'confirmed',
    label: 'Confirmed',
    icon: AlertCircle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  {
    id: 'ready',
    label: 'Ready',
    icon: Package,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  {
    id: 'out_for_delivery',
    label: 'Out for Delivery',
    icon: Truck,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  {
    id: 'delivered',
    label: 'Delivered',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  }
];

export default function VendorOrders() {
  const [activeTab, setActiveTab] = useState('placed');
  const [orders, setOrders] = useState({
    placed: [],
    confirmed: [],
    ready: [],
    out_for_delivery: [],
    delivered: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // ✅ ADDED: Delivery partner assignment states
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [availablePartners, setAvailablePartners] = useState([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [assigningPartner, setAssigningPartner] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    checkAuthentication();
    fetchOrders();
  }, []);

  const checkAuthentication = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        router.push('/login');
        return;
      }

      const userData = await response.json();
      if (userData.user.role !== 'vendor') {
        toast.error('Access denied. Vendor role required.');
        router.push('/login');
      }
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/login');
    }
  };

  const fetchOrders = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch('/api/vendor/orders');

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
      } else {
        toast.error('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Fetch orders error:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // ✅ ADDED: Fetch available delivery partners
  const fetchAvailablePartners = async () => {
    try {
      setLoadingPartners(true);
      const response = await fetch('/api/vendor/delivery-partners/available');
      
      if (response.ok) {
        const data = await response.json();
        setAvailablePartners(data.partners || []);
      } else {
        toast.error('Failed to fetch delivery partners');
        setAvailablePartners([]);
      }
    } catch (error) {
      console.error('Error fetching delivery partners:', error);
      toast.error('Failed to fetch delivery partners');
      setAvailablePartners([]);
    } finally {
      setLoadingPartners(false);
    }
  };

  // ✅ ADDED: Assign delivery partner to order
  const assignDeliveryPartner = async (partnerId) => {
    if (!selectedOrder || !partnerId) {
      toast.error('Please select a delivery partner');
      return;
    }

    try {
      setAssigningPartner(true);
      const response = await fetch('/api/vendor/orders/assign-delivery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: selectedOrder._id,
          deliveryPartnerId: partnerId
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Delivery partner assigned successfully!');
        handleStatusUpdate(selectedOrder._id, 'out_for_delivery');
        setShowDeliveryModal(false);
        setSelectedOrder(null);
        fetchOrders(); // Refresh orders
      } else {
        toast.error(data.error || 'Failed to assign delivery partner');
      }
    } catch (error) {
      console.error('Error assigning delivery partner:', error);
      toast.error('Failed to assign delivery partner');
    } finally {
      setAssigningPartner(false);
    }
  };

  // ✅ UPDATED: Enhanced status update handler
  const handleStatusUpdate = (orderId, newStatus) => {
    setOrders(prevOrders => {
      const updatedOrders = { ...prevOrders };

      // Find and remove order from current status
      let movedOrder = null;
      Object.keys(updatedOrders).forEach(status => {
        const orderIndex = updatedOrders[status].findIndex(order => order._id === orderId);
        if (orderIndex !== -1) {
          movedOrder = updatedOrders[status].splice(orderIndex, 1)[0];
          movedOrder.status = newStatus;
        }
      });

      // Add order to new status
      if (movedOrder && updatedOrders[newStatus]) {
        updatedOrders[newStatus].unshift(movedOrder);
      }

      return updatedOrders;
    });
  };

  // ✅ ADDED: Handle ready for delivery action
  const handleReadyForDelivery = (order) => {
    setSelectedOrder(order);
    setShowDeliveryModal(true);
    fetchAvailablePartners();
  };

  const getOrderCount = (status) => {
    return orders[status]?.length || 0;
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
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
              <p className="text-gray-600">Manage your restaurant orders and assign delivery partners</p>
            </div>
            <button
              onClick={fetchOrders}
              disabled={isRefreshing}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              const count = getOrderCount(tab.id);

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${isActive
                      ? `${tab.color} border-current`
                      : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <IconComponent className="h-5 w-5 mr-2" />
                  {tab.label}
                  {count > 0 && (
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isActive ? tab.bgColor : 'bg-gray-100 text-gray-900'
                      }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Order Cards */}
        <div className="space-y-6">
          {orders[activeTab]?.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                {(() => {
                  const tab = tabs.find(t => t.id === activeTab);
                  if (tab?.icon) {
                    const IconComponent = tab.icon;
                    return <IconComponent className="h-12 w-12 mx-auto" />;
                  }
                  return null;
                })()}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No {tabs.find(tab => tab.id === activeTab)?.label?.toLowerCase()} orders
              </h3>
              <p className="text-gray-500">
                {activeTab === 'placed'
                  ? 'New orders will appear here when customers place them.'
                  : activeTab === 'confirmed'
                  ? 'Confirmed orders will appear here after you accept them.'
                  : activeTab === 'ready'
                  ? 'Orders ready for delivery will appear here.'
                  : activeTab === 'out_for_delivery'
                  ? 'Orders out for delivery will appear here.'
                  : 'Delivered orders will appear here.'
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {orders[activeTab]?.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  onStatusUpdate={handleStatusUpdate}
                  onReadyForDelivery={handleReadyForDelivery} // ✅ ADDED: Pass handler
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ✅ ADDED: Delivery Partner Assignment Modal */}
      {showDeliveryModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl mx-auto shadow-2xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Assign Delivery Partner</h3>
                  <p className="text-sm text-gray-600">Order #{selectedOrder.orderNumber}</p>
                </div>
                <button
                  onClick={() => setShowDeliveryModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4 max-h-96 overflow-y-auto">
              {loadingPartners ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-gray-600">Loading delivery partners...</span>
                </div>
              ) : availablePartners.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Available Partners</h4>
                  <p className="text-gray-600">
                    No verified delivery partners are currently available in your area.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Select a delivery partner for this order:
                  </p>
                  
                  {availablePartners.map((partner) => (
                    <div
                      key={partner.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => assignDeliveryPartner(partner.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {partner.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{partner.name}</h4>
                            <p className="text-sm text-gray-600">{partner.phone}</p>
                            <div className="flex items-center mt-1">
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                {partner.vehicleType} - {partner.vehicleNumber}
                              </span>
                              <span className="ml-2 text-xs text-gray-500">
                                ⭐ {partner.rating.toFixed(1)} ({partner.totalDeliveries} deliveries)
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            Available
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Zones: {partner.deliveryZones.join(', ')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowDeliveryModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                disabled={assigningPartner}
              >
                Cancel
              </button>
              {assigningPartner && (
                <div className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Assigning...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
