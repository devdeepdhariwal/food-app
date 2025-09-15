// app/api/delivery-partner/availability/route.js
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import DeliveryPartner from '@/models/DeliveryPartner';
import connectDB from '@/lib/mongodb';

// Helper function to get user from token
async function getUserFromToken(request) {
  try {
    const token = request.cookies.get('token')?.value || 
                 request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    await connectDB();
    const user = await User.findById(decoded.userId).select('-password');
    
    return user;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

// POST - Toggle availability status
export async function POST(request) {
  try {
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'delivery_partner') {
      return NextResponse.json({ error: 'Access denied. Delivery partner role required.' }, { status: 403 });
    }

    const { isAvailable } = await request.json();
    
    await connectDB();

    const partner = await DeliveryPartner.findOne({ userId: user._id });
    
    if (!partner) {
      return NextResponse.json({ error: 'Partner profile not found' }, { status: 404 });
    }

    // ✅ FIXED: Check profile completion properly
    const completion = partner.calculateCompletion();
    console.log('📊 Profile completion check:', completion);
    
    // ✅ FIXED: Only block if trying to go available with incomplete profile
    if (isAvailable && completion.percentage < 80) {
      return NextResponse.json({ 
        error: 'Please complete your profile before going available',
        completion: completion
      }, { status: 400 });
    }

    // ✅ Update availability status
    partner.isAvailable = isAvailable;
    partner.updatedAt = new Date();
    
    await partner.save();

    console.log(`✅ Partner availability updated to: ${isAvailable}`);

    return NextResponse.json({
      success: true,
      isAvailable: partner.isAvailable,
      message: `You are now ${isAvailable ? 'available' : 'unavailable'} for deliveries`
    });

  } catch (error) {
    console.error('❌ Error updating availability:', error);
    return NextResponse.json(
      { error: 'Failed to update availability', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update location (kept for compatibility)
export async function PUT(request) {
  try {
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'delivery_partner') {
      return NextResponse.json({ error: 'Access denied. Delivery partner role required.' }, { status: 403 });
    }

    const { latitude, longitude, address } = await request.json();
    
    await connectDB();

    const partner = await DeliveryPartner.findOne({ userId: user._id });
    
    if (!partner) {
      return NextResponse.json({ error: 'Partner profile not found' }, { status: 404 });
    }

    // Update location if provided
    if (latitude && longitude) {
      partner.currentLocation = {
        latitude,
        longitude,
        address: address || 'Current Location',
        updatedAt: new Date()
      };
      
      await partner.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Location updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating location:', error);
    return NextResponse.json(
      { error: 'Failed to update location', details: error.message },
      { status: 500 }
    );
  }
}
