// app/api/vendor/delivery-partners/route.js
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import DeliveryPartner from '@/models/DeliveryPartner';
import Vendor from '@/models/VendorProfile';
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
    console.error('Error verifying token:', error);
    return null;
  }
}

// GET - Fetch delivery partners for verification
export async function GET(request) {
  try {
    const user = await getUserFromToken(request);
    
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const vendor = await Vendor.findOne({ userId: user._id });
    if (!vendor) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;

    // ✅ FIXED: Use the correct field name from your vendor schema
    let vendorPincodes = [];
    
    // Check multiple possible field names in your vendor document
    if (vendor.deliveryPincodes && vendor.deliveryPincodes.length > 0) {
      vendorPincodes = vendor.deliveryPincodes;  // ✅ This matches your DB structure
    } else if (vendor.deliveryAreas && vendor.deliveryAreas.length > 0) {
      vendorPincodes = vendor.deliveryAreas;
    } else if (vendor.pincodes && vendor.pincodes.length > 0) {
      vendorPincodes = vendor.pincodes;
    } else if (vendor.pincode) {
      vendorPincodes = [vendor.pincode];  // ✅ You also have this field
    }

    console.log('🔍 VENDOR PINCODES DEBUG:', {
      vendorId: vendor._id,
      restaurantName: vendor.restaurantName,
      deliveryPincodes: vendor.deliveryPincodes,
      pincode: vendor.pincode,
      finalVendorPincodes: vendorPincodes
    });
    
    if (vendorPincodes.length === 0) {
      console.log('❌ No delivery pincodes found for vendor');
      return NextResponse.json({
        success: true,
        deliveryPartners: [],
        totalCount: 0,
        message: 'No delivery areas configured',
        vendorAreas: []
      });
    }

    // Build query for delivery partners
    let query = {};
    
    // ✅ Match delivery partners whose zones overlap with vendor's pincodes
    query.deliveryZones = { $in: vendorPincodes };
    
    // Filter by verification status
    if (status === 'pending') {
      query.verificationStatus = { $in: ['pending', 'in_review'] };
    } else if (status === 'verified') {
      query.verificationStatus = 'approved';
    }
    
    // Only show partners with complete profiles
    query.isProfileComplete = true;

    console.log('🔍 FINAL QUERY:', {
      query,
      vendorPincodes,
      status
    });

    const deliveryPartners = await DeliveryPartner.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await DeliveryPartner.countDocuments(query);

    console.log('🔍 RESULTS:', {
      foundPartners: deliveryPartners.length,
      totalCount,
      partnerNames: deliveryPartners.map(p => p.fullName)
    });

    // Format the response data
    const formattedPartners = deliveryPartners.map(partner => {
      const completion = partner.calculateCompletion();
      return {
        id: partner._id,
        userId: partner.userId._id,
        name: partner.fullName,
        email: partner.userId.email,
        phone: partner.mobileNo,
        address: {
          street: partner.address.street,
          city: partner.address.city,
          state: partner.address.state,
          pincode: partner.address.pincode
        },
        deliveryZones: partner.deliveryZones,
        vehicleDetails: {
          type: partner.vehicleDetails.vehicleType,
          number: partner.vehicleDetails.vehicleNumber,
          license: partner.vehicleDetails.licenseNumber
        },
        verificationStatus: partner.verificationStatus,
        isVerified: partner.isVerified,
        profileCompletion: completion.percentage,
        rating: partner.rating?.average || 0,
        totalDeliveries: partner.deliveryStats?.completedDeliveries || 0,
        createdAt: partner.createdAt,
        documents: {
          profilePhoto: partner.documents?.profilePhoto,
          licensePhoto: partner.documents?.licensePhoto,
          aadharPhoto: partner.documents?.aadharPhoto
        }
      };
    });

    return NextResponse.json({
      success: true,
      deliveryPartners: formattedPartners,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      vendorAreas: vendorPincodes
    });

  } catch (error) {
    console.error('❌ Error fetching delivery partners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery partners', details: error.message },
      { status: 500 }
    );
  }
}
