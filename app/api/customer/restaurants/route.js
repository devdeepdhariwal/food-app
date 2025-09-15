import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import VendorProfile from '@/models/VendorProfile';
import MenuItem from '@/models/MenuItem';

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const pincode = searchParams.get('pincode');
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const sortBy = searchParams.get('sortBy') || 'relevance';
    const vegOnly = searchParams.get('vegOnly') === 'true';
    const minRating = parseInt(searchParams.get('minRating')) || 0;

    console.log('🔍 API called with category:', category);

    // Build restaurant filter
    let restaurantFilter = {};
    
    // Filter by pincode if provided
    if (pincode) {
      restaurantFilter.$or = [
        { pincode: pincode },
        { deliveryPincodes: { $in: [pincode] } }
      ];
    }

    console.log('🏪 Restaurant filter:', restaurantFilter);

    // Get restaurants (VendorProfiles)
    let restaurants = await VendorProfile.find(restaurantFilter)
      .select('_id userId restaurantName restaurantPhoto city fullAddress mobileNo workingHours isOpen closureReason isProfileComplete')
      .lean();

    console.log('📊 Found restaurants:', restaurants.length);
    
    // Debug: Show restaurant IDs and userIds
    restaurants.forEach(restaurant => {
      console.log(`🏪 Restaurant: ${restaurant.restaurantName}`);
      console.log(`   - VendorProfile ID: ${restaurant._id}`);
      console.log(`   - User ID (vendorId in MenuItem): ${restaurant.userId}`);
    });

    // Filter only complete profiles
    restaurants = restaurants.filter(restaurant => restaurant.isProfileComplete);
    console.log('✅ Complete profiles:', restaurants.length);

    // If category is selected, filter restaurants that have items in that category
    if (category && category !== 'all') {
      // **FIX: Use userId (not _id) to match with MenuItem.vendorId**
      const vendorUserIds = restaurants.map(r => r.userId);
      console.log('🔍 Searching for category:', category, 'with vendorUserIds:', vendorUserIds);
      
      // Case-insensitive category search with variations
      const categoryVariations = [
        new RegExp(`^${category}$`, 'i'),           // Exact match
        new RegExp(`^${category}s$`, 'i'),          // Add 's'
        new RegExp(`^${category.slice(0, -1)}$`, 'i') // Remove 's'
      ];

      console.log('🔍 Category variations:', categoryVariations.map(r => r.source));

      // **FIX: Search MenuItem using userId as vendorId**
      const restaurantsWithCategory = await MenuItem.distinct('vendorId', {
        vendorId: { $in: vendorUserIds }, // Use userId from VendorProfile
        category: { $in: categoryVariations },
        isAvailable: true
      });

      console.log('🍽️ VendorIds (userIds) with category items:', restaurantsWithCategory);

      // Debug: Check what's in MenuItem collection
      const allMenuItems = await MenuItem.find({
        vendorId: { $in: vendorUserIds }
      }).select('vendorId dishName category').lean();
      
      console.log('📋 All menu items for these vendors:');
      allMenuItems.forEach(item => {
        console.log(`   - ${item.dishName} (${item.category}) - vendorId: ${item.vendorId}`);
      });

      // **FIX: Filter restaurants based on userId matching MenuItem.vendorId**
      restaurants = restaurants.filter(restaurant => 
        restaurantsWithCategory.some(vendorId => vendorId.toString() === restaurant.userId.toString())
      );

      console.log('🎯 Final filtered restaurants:', restaurants.length);
    }

    // Get menu items for each restaurant
    const restaurantsWithMenus = await Promise.all(
      restaurants.map(async (restaurant) => {
        let menuFilter = {
          vendorId: restaurant.userId, // **FIX: Use userId instead of _id**
          isAvailable: true
        };

        // Case-insensitive category filter
        if (category && category !== 'all') {
          const categoryVariations = [
            new RegExp(`^${category}$`, 'i'),
            new RegExp(`^${category}s$`, 'i'),
            new RegExp(`^${category.slice(0, -1)}$`, 'i')
          ];
          menuFilter.category = { $in: categoryVariations };
        }

        // Filter by search query
        if (search) {
          menuFilter.$or = [
            { dishName: { $regex: new RegExp(search, 'i') } },
            { description: { $regex: new RegExp(search, 'i') } }
          ];
        }

        // Filter by veg only
        if (vegOnly) {
          menuFilter.isVeg = true;
        }

        console.log('🍽️ Menu filter for', restaurant.restaurantName, ':', menuFilter);

        const menuItems = await MenuItem.find(menuFilter)
          .select('dishName category price photo description isVeg preparationTime')
          .limit(category && category !== 'all' ? 50 : 10)
          .lean();

        console.log('📋 Found menu items for', restaurant.restaurantName, ':', menuItems.length);

        return {
          id: restaurant._id, // Keep VendorProfile ID for frontend navigation
          userId: restaurant.userId, // Include userId for reference
          name: restaurant.restaurantName,
          image: restaurant.restaurantPhoto,
          rating: 4.0,
          deliveryTime: '30-45 min',
          address: `${restaurant.fullAddress}, ${restaurant.city}`,
          phone: restaurant.mobileNo,
          workingHours: restaurant.workingHours || '9:00 AM - 10:00 PM',
          isOpen: restaurant.isOpen ?? true,
          closureReason: restaurant.closureReason,
          menuItems: menuItems.map(item => ({
            id: item._id,
            name: item.dishName,
            category: item.category,
            price: item.price,
            image: item.photo,
            description: item.description,
            isVeg: item.isVeg,
            preparationTime: item.preparationTime
          }))
        };
      })
    );

    // Filter out restaurants with no menu items
    const filteredRestaurants = restaurantsWithMenus.filter(restaurant => {
      if (search || (category && category !== 'all')) {
        return restaurant.menuItems.length > 0;
      }
      return true;
    });

    console.log('✅ Final result:', filteredRestaurants.length, 'restaurants');

    // Sort restaurants
    let sortedRestaurants = [...filteredRestaurants];
    switch (sortBy) {
      case 'rating':
        sortedRestaurants.sort((a, b) => b.rating - a.rating);
        break;
      case 'delivery_time':
        sortedRestaurants.sort((a, b) => a.deliveryTime.localeCompare(b.deliveryTime));
        break;
      case 'relevance':
      default:
        break;
    }

    return NextResponse.json({
      success: true,
      restaurants: sortedRestaurants,
      totalCount: sortedRestaurants.length,
      appliedFilters: {
        pincode,
        category,
        search,
        vegOnly,
        minRating
      }
    });

  } catch (error) {
    console.error('💥 Error fetching restaurants:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch restaurants', error: error.message },
      { status: 500 }
    );
  }
}
