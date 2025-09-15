'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Power, Clock } from 'lucide-react';

export default function SimpleStatusToggle() {
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closureReason, setClosureReason] = useState('');
  const [workingHours, setWorkingHours] = useState('9:00 AM - 10:00 PM');

  const handleToggle = async () => {
    if (isOpen) {
      // Opening restaurant - no modal needed
      await updateStatus(false);
    } else {
      // Closing restaurant - show modal for reason
      setShowCloseModal(true);
    }
  };

  const updateStatus = async (status, reason = '') => {
    setLoading(true);
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
        setShowCloseModal(false);
        setClosureReason('');
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update restaurant status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-3 ${isOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <div>
            <h3 className="font-medium text-gray-900">
              {isOpen ? 'Restaurant Open' : 'Restaurant Closed'}
            </h3>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <Clock className="w-4 h-4 mr-1" />
              <span>{workingHours}</span>
            </div>
            {!isOpen && closureReason && (
              <p className="text-sm text-red-600 mt-1">Reason: {closureReason}</p>
            )}
          </div>
        </div>
        
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
            isOpen 
              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          <Power className="w-4 h-4 mr-2" />
          {loading ? 'Updating...' : isOpen ? 'Close' : 'Open'}
        </button>
      </div>

      {/* Simple Close Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-4">Close Restaurant</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (optional)
              </label>
              <input
                type="text"
                value={closureReason}
                onChange={(e) => setClosureReason(e.target.value)}
                placeholder="e.g., Holiday, Break time"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCloseModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => updateStatus(false, closureReason)}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Closing...' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
