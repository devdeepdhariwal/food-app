import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb'; // Fixed import name
import VendorProfile from '@/models/VendorProfile';

export async function GET(request, { params }) {
  console.log('🚀 API Route hit with ID:', params.id);
  
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      console.log('❌ Invalid ObjectId format');
      return NextResponse.json(
        { success: false, message: 'Invalid restaurant ID format' },
        { status: 400 }
      );
    }

    console.log('🔗 Connecting to database...');
    await connectDB(); // Fixed function name
    console.log('✅ Database connected');

    // Debug: Check collection stats
    const totalCount = await VendorProfile.countDocuments();
    console.log('📊 Total vendors in collection:', totalCount);

    // Find the vendor profile
    const restaurant = await VendorProfile.findById(params.id);
    console.log('🔍 Restaurant found:', !!restaurant);

    if (!restaurant) {
      console.log('❌ Restaurant not found');
      
      // Debug: Show available IDs
      const availableIds = await VendorProfile.find().limit(5).select('_id restaurantName');
      console.log('Available IDs:', availableIds.map(doc => ({ id: doc._id, name: doc.restaurantName })));
      
      return NextResponse.json(
        { success: false, message: 'Restaurant not found' },
        { status: 404 }
      );
    }

    // Check if profile is complete (instead of isActive)
    if (!restaurant.isProfileComplete) {
      console.log('⚠️ Restaurant profile incomplete');
      return NextResponse.json(
        { success: false, message: 'Restaurant profile not complete' },
        { status: 404 }
      );
    }

    console.log('✅ Formatting restaurant data...');

    // Format response based on ACTUAL schema fields
    const formattedRestaurant = {
      id: restaurant._id,
      name: restaurant.restaurantName,
      description: restaurant.description || 'Delicious food awaits you!', // Default description
      imageUrl: restaurant.restaurantPhoto || null, // Correct field name
      cuisines: restaurant.cuisineTypes ? restaurant.cuisineTypes.split(',').map(c => c.trim()) : ['Multi-Cuisine'], // Default
      rating: restaurant.averageRating || 4.0, // Default rating
      totalReviews: restaurant.totalReviews || 0,
      deliveryTime: `${restaurant.estimatedDeliveryTime || 30}-${(restaurant.estimatedDeliveryTime || 30) + 10} min`,
      deliveryFee: restaurant.deliveryFee || 0,
      minimumOrder: restaurant.minimumOrder || 0,
      isPureVeg: restaurant.isVegetarian || false,
      priceRange: restaurant.priceRange || 2,
      address: `${restaurant.fullAddress}, ${restaurant.city}`, // Correct field name
      phone: restaurant.mobileNo, // Correct field name
      operatingHours: restaurant.operatingHours || '10:00 AM - 10:00 PM',
      isOpen: true,
      deliveryPincodes: restaurant.deliveryPincodes || []
    };

    console.log('✅ Successfully formatted restaurant:', formattedRestaurant.name);

    return NextResponse.json({
      success: true,
      restaurant: formattedRestaurant
    });

  } catch (error) {
    console.error('💥 Error fetching restaurant:', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching restaurant details', error: error.message },
      { status: 500 }
    );
  }
}
