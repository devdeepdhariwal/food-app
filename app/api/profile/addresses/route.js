// app/api/profile/addresses/route.js
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import UserProfile from '@/models/UserProfile';
import User from '@/models/User';
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

export async function GET(request) {
  try {
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const profile = await UserProfile.findOne({ userId: user._id });

    return NextResponse.json({
      success: true,
      addresses: profile?.addresses || []
    });

  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addresses' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const addressData = await request.json();
    await connectDB();

    let profile = await UserProfile.findOne({ userId: user._id });
    
    if (!profile) {
      profile = new UserProfile({ 
        userId: user._id,
        personalInfo: {
          firstName: user.name?.split(' ')[0] || '',
          lastName: user.name?.split(' ').slice(1).join(' ') || '',
          email: user.email || ''
        }
      });
    }

    // If this is the first address or marked as default, make it default
    if (profile.addresses.length === 0 || addressData.isDefault) {
      profile.addresses.forEach(addr => addr.isDefault = false);
      addressData.isDefault = true;
    }

    // Add unique ID for the address
    addressData.id = new Date().getTime().toString();
    
    profile.addresses.push(addressData);
    await profile.save();

    return NextResponse.json({
      success: true,
      address: profile.addresses[profile.addresses.length - 1],
      completion: profile.profileCompletion
    });

  } catch (error) {
    console.error('Error adding address:', error);
    return NextResponse.json(
      { error: 'Failed to add address' },
      { status: 500 }
    );
  }
}
