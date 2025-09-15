// app/api/vendor/orders/update-status/route.js
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import Order from '@/models/Order';
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

    const { orderId, status } = await request.json();
    
    if (!orderId || !status) {
      return NextResponse.json({ 
        error: 'Order ID and status are required' 
      }, { status: 400 });
    }

    // Validate status
    const validStatuses = ['placed', 'confirmed', 'ready', 'out_for_delivery', 'delivered'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status' 
      }, { status: 400 });
    }

    await connectDB();

    // ✅ FIXED: Find the order with proper error handling
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    console.log('🔍 Order found:', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      restaurantDetails: order.restaurantDetails,
      currentStatus: order.status
    });

    // ✅ FIXED: Get vendor profile to verify ownership
    const vendorProfile = await VendorProfile.findOne({ userId: user._id });
    if (!vendorProfile) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
    }

    // ✅ FIXED: Check different possible ways the vendor might be stored in the order
    let isAuthorized = false;
    
    // Check if order has restaurantDetails.vendorId
    if (order.restaurantDetails && order.restaurantDetails.vendorId) {
      isAuthorized = order.restaurantDetails.vendorId.toString() === vendorProfile._id.toString();
    }
    // Check if order has restaurantDetails.restaurantId that matches vendor profile
    else if (order.restaurantDetails && order.restaurantDetails.restaurantId) {
      isAuthorized = order.restaurantDetails.restaurantId.toString() === vendorProfile._id.toString();
    }
    // Check if order has vendorId directly
    else if (order.vendorId) {
      isAuthorized = order.vendorId.toString() === vendorProfile._id.toString();
    }
    // Check if order has restaurant field
    else if (order.restaurant) {
      isAuthorized = order.restaurant.toString() === vendorProfile._id.toString();
    }
    // Check by restaurant name if no ID match
    else if (order.restaurantDetails && order.restaurantDetails.name && vendorProfile.restaurantName) {
      isAuthorized = order.restaurantDetails.name === vendorProfile.restaurantName;
    }

    console.log('🔍 Authorization check:', {
      userId: user._id,
      vendorProfileId: vendorProfile._id,
      orderVendorId: order.restaurantDetails?.vendorId,
      orderRestaurantId: order.restaurantDetails?.restaurantId,
      isAuthorized
    });

    if (!isAuthorized) {
      return NextResponse.json({ 
        error: 'Unauthorized to modify this order',
        debug: {
          orderRestaurantDetails: order.restaurantDetails,
          vendorProfileId: vendorProfile._id
        }
      }, { status: 403 });
    }

    // ✅ Update order status with timestamp
    const previousStatus = order.status;
    order.status = status;
    order.updatedAt = new Date();

    // Add specific timestamps based on status
    switch (status) {
      case 'confirmed':
        order.confirmedAt = new Date();
        break;
      case 'ready':
        order.readyAt = new Date();
        break;
      case 'out_for_delivery':
        order.outForDeliveryAt = new Date();
        break;
      case 'delivered':
        order.deliveredAt = new Date();
        break;
    }

    await order.save();

    console.log(`✅ Order ${order.orderNumber} status updated: ${previousStatus} → ${status}`);

    return NextResponse.json({
      success: true,
      message: `Order status updated to ${status}`,
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        previousStatus,
        updatedAt: order.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Error updating order status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update order status', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
