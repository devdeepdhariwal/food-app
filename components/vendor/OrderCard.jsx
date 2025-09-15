// components/vendor/OrderCard.jsx
'use client';

import React, { useState } from 'react';
import { Clock, User, Phone, MapPin, Package, Truck, CheckCircle, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrderCard({ order, onStatusUpdate, onReadyForDelivery }) {
  const [isUpdating, setIsUpdating] = useState(false);

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleStatusUpdate = async (newStatus) => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/vendor/orders/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order._id,
          status: newStatus
        }),
      });

      const data = await response.json();

      if (data.success) {
        onStatusUpdate(order._id, newStatus);
        toast.success(`Order ${newStatus === 'confirmed' ? 'confirmed' : newStatus === 'ready' ? 'marked as ready' : 'updated'} successfully!`);
      } else {
        toast.error(data.error || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'placed':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-800';
      case 'ready':
        return 'bg-orange-100 text-orange-800';
      case 'out_for_delivery':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'placed':
        return <Clock className="w-4 h-4" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'ready':
        return <Package className="w-4 h-4" />;
      case 'out_for_delivery':
        return <Truck className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const renderActionButton = () => {
    if (isUpdating) {
      return (
        <button
          disabled
          className="w-full flex items-center justify-center px-4 py-3 bg-gray-400 text-white rounded-lg font-medium"
        >
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          Updating...
        </button>
      );
    }

    switch (order.status) {
      case 'placed':
        return (
          <button
            onClick={() => handleStatusUpdate('confirmed')}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
          >
            Confirm Order
          </button>
        );
      
      case 'confirmed':
        return (
          <button
            onClick={() => handleStatusUpdate('ready')}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            Mark Ready
          </button>
        );
      
      case 'ready':
        return (
          <button
            onClick={() => onReadyForDelivery(order)}
            className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors flex items-center justify-center"
          >
            <Users className="w-4 h-4 mr-2" />
            Assign Delivery Partner
          </button>
        );
      
      case 'out_for_delivery':
        return (
          <div className="w-full px-4 py-3 bg-indigo-100 text-indigo-800 rounded-lg font-medium text-center">
            Out for Delivery
            {order.deliveryDetails?.partnerName && (
              <div className="text-xs mt-1">
                Partner: {order.deliveryDetails.partnerName}
              </div>
            )}
          </div>
        );
      
      case 'delivered':
        return (
          <div className="w-full px-4 py-3 bg-green-100 text-green-800 rounded-lg font-medium text-center flex items-center justify-center">
            <CheckCircle className="w-4 h-4 mr-2" />
            Delivered
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">#{order.orderNumber}</h3>
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getStatusColor(order.status)}`}>
            {getStatusIcon(order.status)}
            <span className="ml-1 uppercase">{order.status.replace('_', ' ')}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-gray-900">{formatCurrency(order.totalAmount)}</div>
          <div className="text-sm text-gray-500">{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* Customer Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <User className="w-4 h-4 mr-2" />
          <span className="font-medium">{order.customerDetails?.name || 'Customer'}</span>
        </div>
        
        {order.customerDetails?.phone && (
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="w-4 h-4 mr-2" />
            <span>{order.customerDetails.phone}</span>
          </div>
        )}
        
        {order.customerDetails?.address && (
          <div className="flex items-start text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{order.customerDetails.address}</span>
          </div>
        )}
      </div>

      {/* Order Items */}
      {order.items && order.items.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Order Items:</h4>
          <div className="space-y-1">
            {order.items.slice(0, 3).map((item, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-gray-600">
                  {item.quantity}x {item.name}
                </span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
            {order.items.length > 3 && (
              <div className="text-xs text-gray-500">
                +{order.items.length - 3} more item{order.items.length - 3 !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delivery Partner Info (if assigned) */}
      {order.deliveryDetails && order.deliveryDetails.partnerName && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Delivery Partner:</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <div>{order.deliveryDetails.partnerName}</div>
            <div>{order.deliveryDetails.partnerPhone}</div>
            {order.deliveryDetails.partnerVehicle && (
              <div className="text-xs">
                {order.deliveryDetails.partnerVehicle.type} - {order.deliveryDetails.partnerVehicle.number}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timestamp */}
      <div className="text-xs text-gray-500 mb-4">
        Placed: {formatTime(order.createdAt)}
        {order.status === 'confirmed' && order.confirmedAt && (
          <div>Confirmed: {formatTime(order.confirmedAt)}</div>
        )}
        {order.status === 'ready' && order.readyAt && (
          <div>Ready: {formatTime(order.readyAt)}</div>
        )}
      </div>

      {/* Action Button */}
      {renderActionButton()}
    </div>
  );
}
