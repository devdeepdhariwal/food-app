'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Check, X } from 'lucide-react';
import ImageUpload from '@/components/common/ImageUpload';

// Default categories (fallback if no categories in DB)
const defaultCategories = [
  'Appetizers', 'Main Course', 'Rice & Biryani', 'Breads', 
  'Desserts', 'Beverages', 'Snacks', 'South Indian', 
  'Chinese', 'Pizza', 'Burger', 'Continental'
];

const menuItemSchema = yup.object({
  dishName: yup.string().required('Dish name is required').min(2, 'Dish name must be at least 2 characters'),
  category: yup.string().required('Category is required'),
  price: yup.number().required('Price is required').min(1, 'Price must be greater than 0'),
  description: yup.string(),
  preparationTime: yup.number().min(1, 'Preparation time must be at least 1 minute'),
  isVeg: yup.boolean(),
  isAvailable: yup.boolean()
});

export default function EditMenuItemPage() {
  const router = useRouter();
  const { itemId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState(null);
  const [categories, setCategories] = useState(defaultCategories);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [newCategoryValue, setNewCategoryValue] = useState('');
  const [addedCategories, setAddedCategories] = useState([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(menuItemSchema),
  });

  const watchedCategory = watch('category');

  useEffect(() => {
    fetchExistingCategories();
    fetchMenuItem();
  }, [itemId]);

  const fetchExistingCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      
      if (data.success && data.categories.length > 0) {
        const categoryNames = data.categories.map(cat => cat.name);
        
        // Merge with default categories and remove duplicates
        const allCategories = [...new Set([...defaultCategories, ...categoryNames])];
        setCategories(allCategories.sort());
        
        console.log('📊 Loaded categories:', allCategories.length);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Keep using default categories on error
    }
  };

  const fetchMenuItem = async () => {
    try {
      const response = await fetch(`/api/vendor/menu/${itemId}`);
      if (response.ok) {
        const data = await response.json();
        const item = data.menuItem;

        // Populate form with existing data
        setValue('dishName', item.dishName);
        setValue('category', item.category);
        setValue('price', item.price);
        setValue('description', item.description || '');
        setValue('preparationTime', item.preparationTime);
        setValue('isVeg', item.isVeg);
        setValue('isAvailable', item.isAvailable);
        setCurrentPhoto(item.photo || null);

        setIsLoading(false);
      } else {
        toast.error('Failed to fetch menu item');
        router.back();
      }
    } catch (error) {
      console.error('Fetch menu item error:', error);
      toast.error('Failed to fetch menu item');
      router.back();
    }
  };

  const handleCategoryChange = (value) => {
    if (value === 'custom') {
      setIsCustomCategory(true);
      setValue('category', '');
      setNewCategoryValue('');
    } else {
      setIsCustomCategory(false);
      setValue('category', value);
    }
  };

  const handleNewCategoryInput = (value) => {
    setNewCategoryValue(value);
    setValue('category', value);
  };

  const addNewCategoryToList = () => {
    const newCategory = newCategoryValue.trim();
    
    if (!newCategory) {
      toast.error('Please enter a category name');
      return;
    }

    if (categories.includes(newCategory)) {
      toast.error('Category already exists');
      return;
    }

    // Add to categories list
    const updatedCategories = [...categories, newCategory].sort();
    setCategories(updatedCategories);
    
    // Track newly added categories
    setAddedCategories(prev => [...prev, newCategory]);
    
    // Reset custom category state
    setIsCustomCategory(false);
    setValue('category', newCategory);
    
    toast.success(`Category "${newCategory}" added successfully!`);
  };

  const cancelNewCategory = () => {
    setIsCustomCategory(false);
    setValue('category', '');
    setNewCategoryValue('');
  };

  const onImageUpload = (imageUrl) => {
    setCurrentPhoto(imageUrl);
  };

  const onImageRemove = () => {
    setCurrentPhoto(null);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/vendor/menu/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          ...data, 
          photo: currentPhoto 
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Menu item updated successfully!');
        if (addedCategories.length > 0) {
          toast.success(`${addedCategories.length} new categories created!`);
        }
        router.push('/dashboard/vendor/menu');
      } else {
        toast.error(result.message || 'Failed to update menu item');
      }
    } catch (error) {
      console.error('Update menu item error:', error);
      toast.error('Failed to update menu item');
    } finally {
      setIsSubmitting(false);
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
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Menu
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Edit Menu Item</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* New Categories Alert */}
        {addedCategories.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Check className="h-5 w-5 text-green-600 mt-0.5" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">New Categories Added</h3>
                <p className="text-sm text-green-700 mt-1">
                  You've created {addedCategories.length} new categories: {addedCategories.join(', ')}
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow">
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Dish Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dish Name *
                  </label>
                  <input
                    {...register('dishName')}
                    type="text"
                    className={`block w-full px-3 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900 ${
                      errors.dishName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter dish name"
                  />
                  {errors.dishName && (
                    <p className="mt-1 text-sm text-red-600">{errors.dishName.message}</p>
                  )}
                </div>

                {/* Enhanced Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <div className="space-y-3">
                    {/* Category Dropdown */}
                    <select
                      value={isCustomCategory ? 'custom' : watchedCategory || ''}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className={`block w-full px-3 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900 ${
                        errors.category ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                          {addedCategories.includes(category) && ' (New)'}
                        </option>
                      ))}
                      <option value="custom" className="text-orange-600 font-medium">
                        + Create New Category
                      </option>
                    </select>
                    
                    {/* Custom Category Input */}
                    {isCustomCategory && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <label className="block text-sm font-medium text-orange-800 mb-2">
                          Create New Category
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newCategoryValue}
                            onChange={(e) => handleNewCategoryInput(e.target.value)}
                            placeholder="Enter new category name"
                            className="flex-1 px-3 py-2 border border-orange-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addNewCategoryToList();
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={addNewCategoryToList}
                            className="px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                            title="Add Category"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={cancelNewCategory}
                            className="px-3 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-orange-600 mt-2">
                          Press Enter or click ✓ to add this category to your menu
                        </p>
                      </div>
                    )}
                  </div>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                  )}
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (₹) *
                  </label>
                  <input
                    {...register('price')}
                    type="number"
                    min="1"
                    className={`block w-full px-3 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900 ${
                      errors.price ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter price"
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    {...register('description')}
                    rows={4}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                    placeholder="Brief description of the dish"
                  />
                </div>

                {/* Preparation Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preparation Time (minutes)
                  </label>
                  <input
                    {...register('preparationTime')}
                    type="number"
                    min="1"
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                    placeholder="15"
                  />
                </div>

                {/* Options */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-6">
                    <label className="flex items-center">
                      <input
                        {...register('isVeg')}
                        type="checkbox"
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Vegetarian</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        {...register('isAvailable')}
                        type="checkbox"
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Available</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Column - Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dish Photo
                </label>
                <ImageUpload
                  currentImage={currentPhoto}
                  onImageUpload={onImageUpload}
                  onImageRemove={onImageRemove}
                  maxSizeMB={5}
                  className="h-80"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Upload a high-quality photo of your dish. Recommended size: 800x600px
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 px-6 py-4 bg-gray-50 rounded-b-lg">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </div>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update Menu Item
                </>
              )}
            </button>
          </div>

          {/* Summary */}
          {addedCategories.length > 0 && (
            <div className="px-6 py-4 bg-blue-50 border-t border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> You've created {addedCategories.length} new categories that will be available for all menu items.
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
