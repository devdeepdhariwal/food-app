// app/api/customer/restaurants/[id]/menu/route.js
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import MenuItem from '@/models/MenuItem';
import VendorProfile from '@/models/VendorProfile';

export async function GET(request, { params }) {
  console.log('🍽️ Menu API - Restaurant ID from URL:', params.id);
  
  try {
    await connectDB();

    // Step 1: Find vendor profile by ID (this is what comes from URL)
    const vendorProfile = await VendorProfile.findById(params.id);
    
    if (!vendorProfile) {
      return NextResponse.json(
        { success: false, message: 'Restaurant not found' },
        { status: 404 }
      );
    }

    console.log('🏪 Found vendor profile:', vendorProfile.restaurantName);
    console.log('👤 Vendor profile userId:', vendorProfile.userId);

    // Step 2: Find menu items using the userId from vendor profile
    const menuItems = await MenuItem.find({ 
      vendorId: vendorProfile.userId, // ✅ Use userId, not vendorProfile._id
      isAvailable: true 
    }).sort({ category: 1, dishName: 1 });

    console.log('📊 Found menu items:', menuItems.length);

    const formattedMenuItems = menuItems.map(item => ({
      _id: item._id,
      name: item.dishName,
      description: item.description || '',
      price: item.price,
      category: item.category,
      image: item.photo,
      isVeg: item.isVeg,
      preparationTime: item.preparationTime || 15,
    }));

    return NextResponse.json({
      success: true,
      menuItems: formattedMenuItems
    });

  } catch (error) {
    console.error('💥 Error fetching menu items:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
