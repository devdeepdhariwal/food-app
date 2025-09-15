// app/dashboard/vendor/delivery-partners/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
  Car,
  Star,
  Package,
  Eye,
  Filter,
  Search,
  ArrowLeft,
  AlertCircle,
  Shield,
  User
} from 'lucide-react';

export default function DeliveryPartnersManagement() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [verificationAction, setVerificationAction] = useState(null);
  const [reason, setReason] = useState('');
  const [vendorAreas, setVendorAreas] = useState([]);

  useEffect(() => {
    fetchDeliveryPartners();
  }, [currentPage, statusFilter]);

  const fetchDeliveryPartners = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        status: statusFilter
      });

      const response = await fetch(`/api/vendor/delivery-partners?${params}`);
      const data = await response.json();

      if (data.success) {
        setDeliveryPartners(data.deliveryPartners);
        setTotalCount(data.totalCount);
        setVendorAreas(data.vendorAreas || []);
      } else {
        console.error('Failed to fetch delivery partners:', data.error);
      }
    } catch (error) {
      console.error('Error fetching delivery partners:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update the handleVerificationAction function:
const handleVerificationAction = async (partnerId, action) => {
  try {
    console.log(`🔄 ${action}ing delivery partner:`, partnerId);
    
    const response = await fetch('/api/vendor/delivery-partners/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partnerId,
        action,
        reason
      })
    });

    const data = await response.json();
    
    console.log('📡 Verification API Response:', data);

    if (data.success) {
      alert(`Delivery partner ${action}d successfully!`);
      fetchDeliveryPartners();
      setShowModal(false);
      setSelectedPartner(null);
      setReason('');
      
      // ✅ ADDED: Show verification summary if available
      if (data.partner.verificationSummary) {
        console.log('✅ Verification Summary:', data.partner.verificationSummary);
      }
    } else {
      console.error(`❌ Verification failed:`, data);
      alert(`Failed to ${action}: ${data.error}`);
      
      // ✅ ADDED: Show debug info if available
      if (data.debug) {
        console.log('🔧 Debug Info:', data.debug);
      }
    }
  } catch (error) {
    console.error(`Error ${action}ing delivery partner:`, error);
    alert(`Failed to ${action} delivery partner`);
  }
};


  const openVerificationModal = (partner, action) => {
    setSelectedPartner(partner);
    setVerificationAction(action);
    setShowModal(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">Verified</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">Rejected</span>;
      case 'in_review':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">In Review</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-bold rounded-full">Pending</span>;
    }
  };

  const filteredPartners = deliveryPartners.filter(partner =>
    partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    partner.phone.includes(searchQuery) ||
    partner.deliveryZones.some(zone => zone.includes(searchQuery))
  );

  if (loading && currentPage === 1) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-bold">Loading delivery partners...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push('/dashboard/vendor')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-bold">Back to Dashboard</span>
            </button>
            <h1 className="text-xl font-bold text-gray-900">Delivery Partner Verification</h1>
            <div className="w-32"></div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-gray-600 font-medium">
              Verify delivery partners in your delivery areas: <span className="font-bold text-blue-600">{vendorAreas.join(', ')}</span>
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-700">Total Partners:</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-bold">{totalCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-gray-500" />
              <span className="font-bold text-gray-900">Filter Partners</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Status Filter */}
            <div className="flex gap-2">
              {[
                { key: 'pending', label: 'Pending Verification', count: 0 },
                { key: 'verified', label: 'Verified', count: 0 },
                { key: 'all', label: 'All Partners', count: totalCount }
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => {
                    setStatusFilter(key);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg font-bold text-sm border transition-colors ${
                    statusFilter === key
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, phone, or pincode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Delivery Partners Grid */}
        {filteredPartners.length > 0 ? (
          <div className="space-y-4">
            {filteredPartners.map((partner) => (
              <div key={partner.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{partner.name}</h3>
                        {getStatusBadge(partner.verificationStatus)}
                        {partner.isVerified && (
                          <div className="flex items-center gap-1 text-green-600">
                            <Shield className="w-4 h-4" />
                            <span className="text-xs font-bold">VERIFIED</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-4 h-4" />
                          <span className="font-medium">{partner.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span className="font-medium">{partner.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span className="font-medium">{partner.address.city}, {partner.address.state}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-2">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Car className="w-4 h-4" />
                          <span className="font-medium">{partner.vehicleDetails.type} - {partner.vehicleDetails.number}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Star className="w-4 h-4" />
                          <span className="font-medium">{partner.rating.toFixed(1)} Rating</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Package className="w-4 h-4" />
                          <span className="font-medium">{partner.totalDeliveries} Deliveries</span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <MapPin className="w-4 h-4" />
                          <span className="font-medium">Delivery Areas:</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {partner.deliveryZones.map((zone, index) => (
                            <span
                              key={index}
                              className={`px-2 py-1 rounded-full text-xs font-bold ${
                                vendorAreas.includes(zone)
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {zone}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-600">Profile: {partner.profileCompletion}%</span>
                    
                    {partner.verificationStatus === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => openVerificationModal(partner, 'approve')}
                          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-bold text-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Verify
                        </button>
                        <button
                          onClick={() => openVerificationModal(partner, 'reject')}
                          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-bold text-sm"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    )}

                    {partner.verificationStatus === 'approved' && (
                      <div className="text-green-600 flex items-center gap-2 font-bold text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Verified
                      </div>
                    )}

                    {partner.verificationStatus === 'rejected' && (
                      <div className="text-red-600 flex items-center gap-2 font-bold text-sm">
                        <XCircle className="w-4 h-4" />
                        Rejected
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {statusFilter === 'pending' ? 'No Pending Verifications' : 'No Delivery Partners Found'}
            </h3>
            <p className="text-gray-600 font-medium">
              {vendorAreas.length === 0 
                ? 'Please set up your delivery areas to see delivery partners.'
                : `No delivery partners found in your areas: ${vendorAreas.join(', ')}`
              }
            </p>
          </div>
        )}

        {/* Pagination */}
        {Math.ceil(totalCount / 10) > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            
            <span className="px-4 py-2 font-bold text-gray-900">
              Page {currentPage} of {Math.ceil(totalCount / 10)}
            </span>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalCount / 10), prev + 1))}
              disabled={currentPage === Math.ceil(totalCount / 10)}
              className="px-4 py-2 border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Verification Modal */}
      {showModal && selectedPartner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md mx-auto shadow-2xl">
            <div className="p-6 border-b">
              <h3 className="text-lg font-bold text-gray-900">
                {verificationAction === 'approve' ? 'Verify' : 'Reject'} Delivery Partner
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {selectedPartner.name} - {selectedPartner.phone}
              </p>
            </div>

            <div className="p-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Reason (Optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={`Why are you ${verificationAction}ing this delivery partner?`}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
                rows={3}
              />
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleVerificationAction(selectedPartner.id, verificationAction)}
                className={`flex-1 px-4 py-2 rounded-lg font-bold text-white ${
                  verificationAction === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {verificationAction === 'approve' ? 'Verify Partner' : 'Reject Partner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
