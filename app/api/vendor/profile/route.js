import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import VendorProfile from '../../../../models/VendorProfile';
import User from '../../../../models/User';

// GET vendor profile
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { message: 'User ID is required' },
        { status: 400 }
      );
    }

    const vendorProfile = await VendorProfile.findOne({ userId }).populate('userId', 'name email');

    if (!vendorProfile) {
      return NextResponse.json(
        { message: 'Profile not found', profileExists: false },
        { status: 404 }
      );
    }

    return NextResponse.json({
      profile: vendorProfile,
      profileExists: true
    });

  } catch (error) {
    console.error('Get vendor profile error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST/PUT vendor profile (create or update)
export async function POST(request) {
  try {
    await connectDB();

    // Extract all needed fields including pincode and deliveryPincodes
    const {
      userId,
      restaurantName,
      restaurantPhoto,
      city,
      mobileNo,
      fullAddress,
      pincode,
      deliveryPincodes
    } = await request.json();

    // Validate required fields
    if (!userId || !restaurantName || !city || !mobileNo || !fullAddress) {
      return NextResponse.json(
        { message: 'All fields except restaurant photo are required' },
        { status: 400 }
      );
    }

    // Process deliveryPincodes if it's a string (comma-separated)
    let processedDeliveryPincodes = deliveryPincodes;
    if (typeof deliveryPincodes === 'string') {
      processedDeliveryPincodes = deliveryPincodes
        .split(',')
        .map(code => code.trim())
        .filter(code => code.length > 0);
    }

    // Validate user exists and is a vendor
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    if (user.role !== 'vendor') {
      return NextResponse.json(
        { message: 'User is not a vendor' },
        { status: 403 }
      );
    }

    // Check if profile already exists
    let vendorProfile = await VendorProfile.findOne({ userId });

    if (vendorProfile) {
      // Update existing profile with ALL fields including pincode and deliveryPincodes
      vendorProfile.restaurantName = restaurantName;
      vendorProfile.restaurantPhoto = restaurantPhoto || vendorProfile.restaurantPhoto;
      vendorProfile.city = city;
      vendorProfile.mobileNo = mobileNo;
      vendorProfile.fullAddress = fullAddress;
      vendorProfile.pincode = pincode;
      vendorProfile.deliveryPincodes = processedDeliveryPincodes;
      vendorProfile.isProfileComplete = true;

      await vendorProfile.save();

      return NextResponse.json({
        message: 'Profile updated successfully',
        profile: vendorProfile
      });
    } else {
      // Create new profile with ALL fields including pincode and deliveryPincodes
      vendorProfile = new VendorProfile({
        userId,
        restaurantName,
        restaurantPhoto,
        city,
        mobileNo,
        fullAddress,
        pincode,
        deliveryPincodes: processedDeliveryPincodes,
        isProfileComplete: true
      });

      await vendorProfile.save();

      return NextResponse.json({
        message: 'Profile created successfully',
        profile: vendorProfile
      }, { status: 201 });
    }

  } catch (error) {
    console.error('Create/Update vendor profile error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
