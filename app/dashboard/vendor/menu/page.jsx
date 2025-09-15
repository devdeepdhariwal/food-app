'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter } from 'lucide-react';
import MenuItemCard from '@/components/vendor/MenuItemCard';
import toast from 'react-hot-toast';

const categories = [
  'All Categories',
  'Appetizers',
  'Main Course', 
  'Rice & Biryani',
  'Breads',
  'Desserts',
  'Beverages',
  'Snacks',
  'South Indian',
  'Chinese',
  'Continental'
];

export default function VendorMenu() {
  const [menuItems, setMenuItems] = useState([]);
  const [groupedMenu, setGroupedMenu] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkAuthentication();
    fetchMenuItems();
  }, [selectedCategory, searchQuery]);

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

  const fetchMenuItems = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'All Categories') {
        params.append('category', selectedCategory);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/vendor/menu?${params}`);
      if (response.ok) {
        const data = await response.json();
        setMenuItems(data.menuItems);
        setGroupedMenu(data.groupedMenu);
      } else {
        toast.error('Failed to fetch menu items');
      }
    } catch (error) {
      console.error('Fetch menu error:', error);
      toast.error('Failed to fetch menu items');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (item) => {
    router.push(`/dashboard/vendor/menu/edit/${item._id}`);
  };

  const handleDelete = async (itemId) => {
    try {
      const response = await fetch(`/api/vendor/menu/${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Menu item deleted successfully');
        fetchMenuItems();
      } else {
        toast.error('Failed to delete menu item');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete menu item');
    }
  };

  const handleToggleAvailability = (itemId, newAvailability) => {
    setMenuItems(prev => 
      prev.map(item => 
        item._id === itemId 
          ? { ...item, isAvailable: newAvailability }
          : item
      )
    );
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
              <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
              <p className="text-gray-600">Manage your restaurant menu items</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/dashboard/vendor/menu/add')}
                className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Menu Items
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 flex items-center space-x-6 text-sm text-gray-600">
            <span>Total Items: {menuItems.length}</span>
            <span>Available: {menuItems.filter(item => item.isAvailable).length}</span>
            <span>Unavailable: {menuItems.filter(item => !item.isAvailable).length}</span>
          </div>
        </div>

        {/* Menu Items */}
        {menuItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Plus className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No menu items found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || selectedCategory !== 'All Categories'
                ? 'No items match your search criteria.'
                : 'Start by adding your first menu item.'
              }
            </p>
            <button
              onClick={() => router.push('/dashboard/vendor/menu/add')}
              className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Menu Items
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {menuItems.map((item) => (
              <MenuItemCard
                key={item._id}
                item={item}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleAvailability={handleToggleAvailability}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
