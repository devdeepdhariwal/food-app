// app/api/delivery-partner/profile/route.js
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

// GET - Fetch delivery partner profile
export async function GET(request) {
  try {
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'delivery_partner') {
      return NextResponse.json({ error: 'Access denied. Delivery partner role required.' }, { status: 403 });
    }

    await connectDB();

    let profile = await DeliveryPartner.findOne({ userId: user._id });
    
    if (!profile) {
      // ✅ Create new profile with minimal required fields only
      profile = new DeliveryPartner({
        userId: user._id,
        fullName: user.name || '',
        mobileNo: user.phone || '',
        // ✅ Initialize with empty objects instead of required fields
        address: {
          street: '',
          city: '',
          state: '',
          pincode: ''
        },
        vehicleDetails: {
          vehicleType: '',
          vehicleNumber: '',
          licenseNumber: ''
        },
        bankDetails: {
          accountHolderName: '',
          accountNumber: '',
          ifscCode: '',
          bankName: ''
        },
        workingHours: [],
        deliveryZones: []
      });
      
      // ✅ Initialize working hours
      profile.initializeWorkingHours();
      
      // ✅ Save without validation for new profiles
      await profile.save({ validateBeforeSave: false });
    }

    // Calculate completion after profile exists
    const completion = profile.calculateCompletion();

    return NextResponse.json({
      success: true,
      profile: profile.toJSON(),
      completion,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('❌ Error fetching delivery partner profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update delivery partner profile
export async function PUT(request) {
  try {
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'delivery_partner') {
      return NextResponse.json({ error: 'Access denied. Delivery partner role required.' }, { status: 403 });
    }

    const data = await request.json();
    await connectDB();

    let profile = await DeliveryPartner.findOne({ userId: user._id });
    
    if (!profile) {
      // Create new profile if doesn't exist
      profile = new DeliveryPartner({
        userId: user._id,
        fullName: '',
        mobileNo: '',
        address: { street: '', city: '', state: '', pincode: '' },
        vehicleDetails: { vehicleType: '', vehicleNumber: '', licenseNumber: '' },
        bankDetails: { accountHolderName: '', accountNumber: '', ifscCode: '', bankName: '' },
        workingHours: [],
        deliveryZones: []
      });
      profile.initializeWorkingHours();
      await profile.save({ validateBeforeSave: false });
    }

    // ✅ Update fields safely
    if (data.fullName !== undefined) profile.fullName = data.fullName;
    if (data.mobileNo !== undefined) profile.mobileNo = data.mobileNo;
    if (data.alternateNo !== undefined) profile.alternateNo = data.alternateNo;
    
    if (data.address) {
      // Merge address fields
      profile.address = {
        street: data.address.street || profile.address.street || '',
        city: data.address.city || profile.address.city || '',
        state: data.address.state || profile.address.state || '',
        pincode: data.address.pincode || profile.address.pincode || ''
      };
    }
    
    if (data.vehicleDetails) {
      // Merge vehicle details
      profile.vehicleDetails = {
        vehicleType: data.vehicleDetails.vehicleType || profile.vehicleDetails.vehicleType || '',
        vehicleNumber: data.vehicleDetails.vehicleNumber || profile.vehicleDetails.vehicleNumber || '',
        licenseNumber: data.vehicleDetails.licenseNumber || profile.vehicleDetails.licenseNumber || ''
      };
    }
    
    if (data.bankDetails) {
      // Merge bank details
      profile.bankDetails = {
        accountHolderName: data.bankDetails.accountHolderName || profile.bankDetails.accountHolderName || '',
        accountNumber: data.bankDetails.accountNumber || profile.bankDetails.accountNumber || '',
        ifscCode: data.bankDetails.ifscCode || profile.bankDetails.ifscCode || '',
        bankName: data.bankDetails.bankName || profile.bankDetails.bankName || ''
      };
    }
    
    if (data.workingHours && Array.isArray(data.workingHours)) {
      profile.workingHours = data.workingHours;
    }
    
    if (data.deliveryZones && Array.isArray(data.deliveryZones)) {
      profile.deliveryZones = data.deliveryZones.filter(zone => zone && zone.trim());
    }
    
    if (data.documents) {
      profile.documents = { ...profile.documents.toObject(), ...data.documents };
    }

    // ✅ Only validate on save if we have minimum required fields
    const hasMinimumFields = profile.fullName && profile.mobileNo;
    
    if (hasMinimumFields) {
      await profile.save(); // Normal save with validation
    } else {
      await profile.save({ validateBeforeSave: false }); // Skip validation for incomplete profiles
    }

    const completion = profile.calculateCompletion();

    return NextResponse.json({
      success: true,
      profile: profile.toJSON(),
      completion,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating delivery partner profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile', details: error.message },
      { status: 500 }
    );
  }
}
