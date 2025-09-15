// app/api/vendor/delivery-partners/available/route.js
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import DeliveryPartner from '@/models/DeliveryPartner';
import VendorProfile from '@/models/VendorProfile';
import connectDB from '@/lib/mongodb';

async function getUserFromToken(request) {
  try {
    const token = request.cookies.get('token')?.value || 
                 request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await connectDB();
    const user = await User.findById(decoded.userId).select('-password');
    return user;
  } catch (error) {
    return null;
  }
}

export async function GET(request) {
  try {
    const user = await getUserFromToken(request);
    
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const vendor = await VendorProfile.findOne({ userId: user._id });
    if (!vendor) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
    }

    // Get vendor pincodes
    let vendorPincodes = [];
    if (vendor.deliveryPincodes && vendor.deliveryPincodes.length > 0) {
      vendorPincodes = vendor.deliveryPincodes;
    } else if (vendor.pincode) {
      vendorPincodes = [vendor.pincode];
    }

    if (vendorPincodes.length === 0) {
      return NextResponse.json({
        success: true,
        partners: [],
        message: 'No delivery areas configured'
      });
    }

    // Find available and verified delivery partners
    const availablePartners = await DeliveryPartner.find({
      deliveryZones: { $in: vendorPincodes },
      isAvailable: true,
      isVerified: true,
      verificationStatus: 'approved'
    }).populate('userId', 'name email');

    const formattedPartners = availablePartners.map(partner => ({
      id: partner._id,
      name: partner.fullName,
      email: partner.userId.email,
      phone: partner.mobileNo,
      vehicleType: partner.vehicleDetails.vehicleType,
      vehicleNumber: partner.vehicleDetails.vehicleNumber,
      rating: partner.rating?.average || 0,
      totalDeliveries: partner.deliveryStats?.completedDeliveries || 0,
      deliveryZones: partner.deliveryZones,
      isAvailable: partner.isAvailable
    }));

    return NextResponse.json({
      success: true,
      partners: formattedPartners,
      count: formattedPartners.length
    });

  } catch (error) {
    console.error('❌ Error fetching available partners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available partners', details: error.message },
      { status: 500 }
    );
  }
}
