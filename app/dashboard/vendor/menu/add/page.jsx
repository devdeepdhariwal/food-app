'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { Plus, Minus, ArrowLeft, Save, List, Check, X } from 'lucide-react';
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

const schema = yup.object({
  items: yup.array().of(menuItemSchema).min(1, 'At least one menu item is required')
});

export default function AddMenuItems() {
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState(defaultCategories);
  const [isCustomCategory, setIsCustomCategory] = useState({});
  const [newCategoryValues, setNewCategoryValues] = useState({});
  const [addedCategories, setAddedCategories] = useState([]);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    setValue
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      items: [{
        dishName: '',
        category: 'Main Course',
        price: '',
        description: '',
        preparationTime: 15,
        isVeg: true,
        isAvailable: true,
        photo: null
      }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const watchedItems = watch('items');

  // Load categories from existing menu items
  useEffect(() => {
    fetchExistingCategories();
  }, []);

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

  const handleCategoryChange = (index, value) => {
    if (value === 'custom') {
      setIsCustomCategory(prev => ({ ...prev, [index]: true }));
      setValue(`items.${index}.category`, '');
      setNewCategoryValues(prev => ({ ...prev, [index]: '' }));
    } else {
      setIsCustomCategory(prev => ({ ...prev, [index]: false }));
      setValue(`items.${index}.category`, value);
      setNewCategoryValues(prev => {
        const newState = { ...prev };
        delete newState[index];
        return newState;
      });
    }
  };

  const handleNewCategoryInput = (index, value) => {
    setNewCategoryValues(prev => ({ ...prev, [index]: value }));
    setValue(`items.${index}.category`, value);
  };

  const addNewCategoryToList = (index) => {
    const newCategory = newCategoryValues[index]?.trim();
    
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
    setIsCustomCategory(prev => ({ ...prev, [index]: false }));
    setValue(`items.${index}.category`, newCategory);
    
    toast.success(`Category "${newCategory}" added successfully!`);
  };

  const cancelNewCategory = (index) => {
    setIsCustomCategory(prev => ({ ...prev, [index]: false }));
    setValue(`items.${index}.category`, '');
    setNewCategoryValues(prev => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });
  };

  const handleImageUpload = (index, imageUrl) => {
    watchedItems[index].photo = imageUrl;
  };

  const handleImageRemove = (index) => {
    watchedItems[index].photo = null;
  };

  const addMenuItem = () => {
    append({
      dishName: '',
      category: categories.length > 0 ? categories[0] : 'Main Course',
      price: '',
      description: '',
      preparationTime: 15,
      isVeg: true,
      isAvailable: true,
      photo: null
    });
  };

  const removeMenuItem = (index) => {
    if (fields.length > 1) {
      remove(index);
      // Remove custom category state for this index
      setIsCustomCategory(prev => {
        const newState = { ...prev };
        delete newState[index];
        return newState;
      });
      setNewCategoryValues(prev => {
        const newState = { ...prev };
        delete newState[index];
        return newState;
      });
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/vendor/menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message);
        if (addedCategories.length > 0) {
          toast.success(`${addedCategories.length} new categories created!`);
        }
        router.push('/dashboard/vendor/menu');
      } else {
        toast.error(result.message || 'Failed to add menu items');
      }
    } catch (error) {
      console.error('Add menu items error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Add Menu Items</h1>
                <p className="text-gray-600">Add multiple dishes to your menu</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/dashboard/vendor/menu')}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <List className="h-4 w-4 mr-2" />
                View & Edit Menu
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {fields.map((field, index) => (
            <div key={field.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Menu Item #{index + 1}
                </h3>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMenuItem(index)}
                    className="flex items-center px-3 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Minus className="w-4 h-4 mr-1" />
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Dish Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dish Name *
                    </label>
                    <input
                      {...register(`items.${index}.dishName`)}
                      type="text"
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900 ${
                        errors.items?.[index]?.dishName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter dish name"
                    />
                    {errors.items?.[index]?.dishName && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.items[index].dishName.message}
                      </p>
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
                        value={isCustomCategory[index] ? 'custom' : watchedItems[index]?.category || ''}
                        onChange={(e) => handleCategoryChange(index, e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900"
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
                      {isCustomCategory[index] && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <label className="block text-sm font-medium text-orange-800 mb-2">
                            Create New Category
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newCategoryValues[index] || ''}
                              onChange={(e) => handleNewCategoryInput(index, e.target.value)}
                              placeholder="Enter new category name"
                              className="flex-1 px-3 py-2 border border-orange-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addNewCategoryToList(index);
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => addNewCategoryToList(index)}
                              className="px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                              title="Add Category"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => cancelNewCategory(index)}
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
                    {errors.items?.[index]?.category && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.items[index].category.message}
                      </p>
                    )}
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (₹) *
                    </label>
                    <input
                      {...register(`items.${index}.price`)}
                      type="number"
                      min="1"
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900 ${
                        errors.items?.[index]?.price ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter price"
                    />
                    {errors.items?.[index]?.price && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.items[index].price.message}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      {...register(`items.${index}.description`)}
                      rows={3}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                      placeholder="Brief description of the dish"
                    />
                  </div>

                  {/* Options */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preparation Time (minutes)
                      </label>
                      <input
                        {...register(`items.${index}.preparationTime`)}
                        type="number"
                        min="1"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                        placeholder="15"
                      />
                    </div>

                    <div className="flex items-center space-x-6">
                      <label className="flex items-center">
                        <input
                          {...register(`items.${index}.isVeg`)}
                          type="checkbox"
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Vegetarian</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          {...register(`items.${index}.isAvailable`)}
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
                    onImageUpload={(imageUrl) => handleImageUpload(index, imageUrl)}
                    currentImage={watchedItems[index]?.photo}
                    onImageRemove={() => handleImageRemove(index)}
                    maxSizeMB={5}
                    className="h-64"
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Add More Button */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={addMenuItem}
              className="flex items-center px-4 py-2 text-orange-600 border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Menu Item
            </button>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={isLoading}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding Items...
                </div>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Add Menu Items
                </>
              )}
            </button>
          </div>

          {/* Enhanced Summary */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              <strong>Summary:</strong> You are adding {fields.length} menu item{fields.length > 1 ? 's' : ''} to your restaurant menu.
              <br />
              Available categories: {categories.length} {addedCategories.length > 0 && `(${addedCategories.length} newly created)`}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
