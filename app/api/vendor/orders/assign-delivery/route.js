// app/api/vendor/orders/assign-delivery/route.js
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import Order from '@/models/Order';
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

export async function POST(request) {
  try {
    const user = await getUserFromToken(request);
    
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, deliveryPartnerId } = await request.json();
    
    if (!orderId || !deliveryPartnerId) {
      return NextResponse.json({ 
        error: 'Order ID and Delivery Partner ID are required' 
      }, { status: 400 });
    }

    await connectDB();

    // ✅ FIXED: Get vendor profile first
    const vendorProfile = await VendorProfile.findOne({ userId: user._id });
    if (!vendorProfile) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    console.log('🔍 Order structure debug:', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      vendorId: order.vendorId,
      restaurantDetails: order.restaurantDetails,
      vendorProfileId: vendorProfile._id
    });

    // ✅ FIXED: Check order ownership using the correct field structure
    let isAuthorized = false;
    
    // Check if order has direct vendorId field (most likely based on your structure)
    if (order.vendorId) {
      isAuthorized = order.vendorId.toString() === vendorProfile._id.toString();
      console.log('✅ Checking vendorId:', {
        orderVendorId: order.vendorId.toString(),
        vendorProfileId: vendorProfile._id.toString(),
        match: isAuthorized
      });
    }
    // Fallback: Check restaurantDetails.vendorId if it exists
    else if (order.restaurantDetails && order.restaurantDetails.vendorId) {
      isAuthorized = order.restaurantDetails.vendorId.toString() === vendorProfile._id.toString();
      console.log('✅ Checking restaurantDetails.vendorId:', {
        orderVendorId: order.restaurantDetails.vendorId.toString(),
        vendorProfileId: vendorProfile._id.toString(),
        match: isAuthorized
      });
    }
    // Another fallback: Check restaurantDetails.restaurantId
    else if (order.restaurantDetails && order.restaurantDetails.restaurantId) {
      isAuthorized = order.restaurantDetails.restaurantId.toString() === vendorProfile._id.toString();
    }

    if (!isAuthorized) {
      console.log('❌ Order authorization failed');
      return NextResponse.json({ 
        error: 'Unauthorized to modify this order',
        debug: {
          orderVendorId: order.vendorId?.toString(),
          orderRestaurantDetails: order.restaurantDetails,
          vendorProfileId: vendorProfile._id.toString()
        }
      }, { status: 403 });
    }

    // Verify order is ready for delivery assignment
    if (order.status !== 'ready') {
      return NextResponse.json({ 
        error: `Order must be ready for delivery assignment. Current status: ${order.status}` 
      }, { status: 400 });
    }

    // Find the delivery partner
    const deliveryPartner = await DeliveryPartner.findById(deliveryPartnerId)
      .populate('userId', 'name email');
    
    if (!deliveryPartner) {
      return NextResponse.json({ error: 'Delivery partner not found' }, { status: 404 });
    }

    // Verify delivery partner is available and verified
    if (!deliveryPartner.isAvailable) {
      return NextResponse.json({ error: 'Delivery partner is not available' }, { status: 400 });
    }

    if (!deliveryPartner.isVerified || deliveryPartner.verificationStatus !== 'approved') {
      return NextResponse.json({ error: 'Delivery partner is not verified' }, { status: 400 });
    }

    console.log('✅ Assigning delivery partner:', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      partnerId: deliveryPartner._id,
      partnerName: deliveryPartner.fullName
    });

    // ✅ ENHANCED: Assign delivery partner to order with more details
    order.deliveryDetails = {
      partnerId: deliveryPartner._id,
      partnerName: deliveryPartner.fullName,
      partnerPhone: deliveryPartner.mobileNo,
      partnerVehicle: {
        type: deliveryPartner.vehicleDetails.vehicleType,
        number: deliveryPartner.vehicleDetails.vehicleNumber
      },
      assignedAt: new Date(),
      estimatedDeliveryTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
      partnerEarnings: 25, // Default delivery fee
      status: 'assigned'
    };

    order.status = 'out_for_delivery';
    order.outForDeliveryAt = new Date();
    order.updatedAt = new Date();

    await order.save();

    // ✅ OPTIONAL: Update delivery partner status (mark as busy)
    // You might want to track that this partner is now busy with a delivery
    // deliveryPartner.currentDelivery = {
    //   orderId: order._id,
    //   orderNumber: order.orderNumber,
    //   assignedAt: new Date()
    // };
    // await deliveryPartner.save();

    console.log(`🚚 Order ${order.orderNumber} assigned to delivery partner ${deliveryPartner.fullName}`);

    return NextResponse.json({
      success: true,
      message: 'Delivery partner assigned successfully',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        deliveryDetails: order.deliveryDetails,
        deliveryPartner: {
          id: deliveryPartner._id,
          name: deliveryPartner.fullName,
          phone: deliveryPartner.mobileNo,
          vehicle: `${deliveryPartner.vehicleDetails.vehicleType} - ${deliveryPartner.vehicleDetails.vehicleNumber}`,
          assignedAt: order.deliveryDetails.assignedAt
        }
      }
    });

  } catch (error) {
    console.error('❌ Error assigning delivery partner:', error);
    return NextResponse.json(
      { error: 'Failed to assign delivery partner', details: error.message },
      { status: 500 }
    );
  }
}
