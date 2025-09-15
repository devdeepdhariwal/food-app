// app/api/vendor/delivery-partners/verify/route.js
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import DeliveryPartner from '@/models/DeliveryPartner';
import VendorProfile from '@/models/VendorProfile'; // ✅ FIXED: Correct import name
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

// POST - Verify or reject delivery partner
export async function POST(request) {
  try {
    const user = await getUserFromToken(request);
    
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { partnerId, action, reason } = await request.json();
    
    if (!partnerId || !action) {
      return NextResponse.json({ error: 'Partner ID and action are required' }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Use approve or reject' }, { status: 400 });
    }

    await connectDB();

    // ✅ FIXED: Use VendorProfile instead of Vendor
    const vendor = await VendorProfile.findOne({ userId: user._id });
    if (!vendor) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
    }

    const deliveryPartner = await DeliveryPartner.findById(partnerId).populate('userId', 'name email');
    if (!deliveryPartner) {
      return NextResponse.json({ error: 'Delivery partner not found' }, { status: 404 });
    }

    // ✅ Get vendor pincodes with correct field names
    let vendorPincodes = [];
    
    // Check multiple possible field names in your vendor document
    if (vendor.deliveryPincodes && vendor.deliveryPincodes.length > 0) {
      vendorPincodes = vendor.deliveryPincodes;
    } else if (vendor.deliveryAreas && vendor.deliveryAreas.length > 0) {
      vendorPincodes = vendor.deliveryAreas;
    } else if (vendor.pincodes && vendor.pincodes.length > 0) {
      vendorPincodes = vendor.pincodes;
    } else if (vendor.pincode) {
      vendorPincodes = [vendor.pincode];
    }

    const partnerPincodes = deliveryPartner.deliveryZones || [];
    
    console.log('🔍 VERIFICATION CHECK:', {
      vendorId: vendor._id,
      vendorName: vendor.restaurantName || vendor.businessName,
      vendorPincodes,
      partnerPincodes,
      partnerId,
      partnerName: deliveryPartner.fullName,
      action
    });

    // Check if vendor has authority to verify this partner (overlapping pincodes)
    const hasOverlap = vendorPincodes.some(pincode => partnerPincodes.includes(pincode));

    if (!hasOverlap) {
      console.log('❌ No overlap found between vendor and partner pincodes');
      return NextResponse.json({ 
        error: 'You can only verify delivery partners in your delivery areas',
        debug: {
          vendorPincodes,
          partnerPincodes,
          hasOverlap: false
        }
      }, { status: 403 });
    }

    console.log('✅ Pincode overlap found, proceeding with verification');

    // ✅ ENHANCED: Use the model method with proper error handling
    try {
      // Use the model method to handle verification
      deliveryPartner.addVerificationAction(
        vendor._id,
        vendor.restaurantName || vendor.businessName || vendor.ownerName || 'Unknown Vendor',
        action, // Pass 'approve' or 'reject' - method converts to enum values
        reason || `${action === 'approve' ? 'Approved' : 'Rejected'} by vendor`
      );

      // Save the updated delivery partner
      await deliveryPartner.save();

      console.log(`🎯 Delivery partner ${deliveryPartner.fullName} ${action}d by vendor ${vendor.restaurantName || vendor.businessName}`);

      // Get verification summary for response
      const verificationSummary = deliveryPartner.getVerificationSummary();

      return NextResponse.json({
        success: true,
        message: `Delivery partner ${action}d successfully`,
        partner: {
          id: deliveryPartner._id,
          name: deliveryPartner.fullName,
          verificationStatus: deliveryPartner.verificationStatus,
          isVerified: deliveryPartner.isVerified,
          verificationSummary,
          // ✅ ADDED: Additional response data
          verifiedBy: deliveryPartner.verifiedBy,
          rejectedBy: deliveryPartner.rejectedBy,
          historyCount: deliveryPartner.verificationHistory.length
        }
      });

    } catch (saveError) {
      console.error('❌ Error saving verification:', saveError);
      
      // ✅ ENHANCED: Better error details
      return NextResponse.json({
        error: 'Failed to save verification status',
        details: saveError.message,
        debug: {
          partnerId,
          action,
          vendorId: vendor._id,
          modelErrors: saveError.errors ? Object.keys(saveError.errors) : []
        }
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Error updating verification status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update verification status', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// ✅ ENHANCED: GET method to fetch verification details
export async function GET(request) {
  try {
    const user = await getUserFromToken(request);
    
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partnerId');

    if (!partnerId) {
      return NextResponse.json({ error: 'Partner ID is required' }, { status: 400 });
    }

    await connectDB();

    const deliveryPartner = await DeliveryPartner.findById(partnerId)
      .populate('userId', 'name email')
      .populate('verificationHistory.vendorId', 'restaurantName businessName'); // ✅ ADDED: Populate vendor details

    if (!deliveryPartner) {
      return NextResponse.json({ error: 'Delivery partner not found' }, { status: 404 });
    }

    const verificationSummary = deliveryPartner.getVerificationSummary();

    return NextResponse.json({
      success: true,
      partner: {
        id: deliveryPartner._id,
        name: deliveryPartner.fullName,
        email: deliveryPartner.userId.email,
        phone: deliveryPartner.mobileNo,
        deliveryZones: deliveryPartner.deliveryZones,
        verificationStatus: deliveryPartner.verificationStatus,
        isVerified: deliveryPartner.isVerified,
        verificationSummary,
        verificationHistory: deliveryPartner.verificationHistory,
        // ✅ ADDED: Additional partner details
        address: deliveryPartner.address,
        vehicleDetails: deliveryPartner.vehicleDetails,
        profileCompletion: deliveryPartner.calculateCompletion()
      }
    });

  } catch (error) {
    console.error('❌ Error fetching verification details:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch verification details', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}
