// app/api/vendor/orders/route.js
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import Order from '@/models/Order';
import VendorProfile from '@/models/VendorProfile';
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

    if (user.role !== 'vendor' && user.role !== 'restaurant') {
      return NextResponse.json({ error: 'Access denied. Vendor role required.' }, { status: 403 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    console.log('🏪 User ID (who logged in):', user._id);
    console.log('🏪 User name:', user.name);

    // ✅ Find the vendor profile for this user
    const vendorProfile = await VendorProfile.findOne({ userId: user._id });
    
    if (!vendorProfile) {
      return NextResponse.json({ 
        error: 'Vendor profile not found. Please complete your restaurant setup.' 
      }, { status: 400 });
    }

    const actualVendorId = vendorProfile._id;
    
    console.log('🎯 Actual Vendor ID (from profile):', actualVendorId);
    console.log('🏪 Restaurant name:', vendorProfile.restaurantName);

    // Build query using the vendor profile ID
    const query = { vendorId: actualVendorId };
    
    if (status && status !== 'all') {
      query.status = status;
    }

    console.log('🔍 MongoDB Query:', query);

    // Get orders for this vendor
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(100);

    console.log(`📦 Found ${orders.length} orders for vendor ${actualVendorId}`);
    
    if (orders.length > 0) {
      console.log('🔍 Sample order:', {
        orderNumber: orders[0].orderNumber,
        vendorId: orders[0].vendorId.toString(),
        status: orders[0].status,
        customerName: orders[0].customerDetails?.name,
        totalAmount: orders[0].totalAmount
      });
    }

    // ✅ FIXED: Group orders by status INCLUDING 'confirmed'
    const ordersByStatus = {
      placed: orders.filter(order => order.status === 'placed'),
      confirmed: orders.filter(order => order.status === 'confirmed'), // ✅ ADDED: Missing confirmed status
      ready: orders.filter(order => order.status === 'ready'),
      out_for_delivery: orders.filter(order => order.status === 'out_for_delivery'),
      delivered: orders.filter(order => order.status === 'delivered'),
      cancelled: orders.filter(order => order.status === 'cancelled')
    };

    // ✅ ENHANCED: Log the grouping for debugging
    console.log('📊 Orders grouped by status:', {
      placed: ordersByStatus.placed.length,
      confirmed: ordersByStatus.confirmed.length, // ✅ Log confirmed count
      ready: ordersByStatus.ready.length,
      out_for_delivery: ordersByStatus.out_for_delivery.length,
      delivered: ordersByStatus.delivered.length,
      cancelled: ordersByStatus.cancelled.length
    });

    // ✅ ENHANCED: Log each confirmed order for debugging
    if (ordersByStatus.confirmed.length > 0) {
      console.log('✅ Confirmed orders found:', ordersByStatus.confirmed.map(order => ({
        orderNumber: order.orderNumber,
        status: order.status,
        confirmedAt: order.confirmedAt,
        updatedAt: order.updatedAt
      })));
    }

    // Calculate statistics
    const stats = {
      total: orders.length,
      today: orders.filter(order => {
        const today = new Date();
        const orderDate = new Date(order.createdAt);
        return orderDate.toDateString() === today.toDateString();
      }).length,
      pending: orders.filter(order => ['placed', 'confirmed', 'ready'].includes(order.status)).length, // ✅ Include confirmed in pending
      completed: orders.filter(order => order.status === 'delivered').length,
      revenue: orders
        .filter(order => order.status === 'delivered')
        .reduce((sum, order) => sum + order.totalAmount, 0)
    };

    return NextResponse.json({
      success: true,
      orders: status && status !== 'all' ? orders : ordersByStatus,
      allOrders: orders,
      stats,
      total: orders.length,
      vendor: {
        userId: user._id,
        vendorId: actualVendorId,
        restaurantName: vendorProfile.restaurantName,
        city: vendorProfile.city,
        address: vendorProfile.fullAddress
      },
      message: `Found ${orders.length} orders for ${vendorProfile.restaurantName}`
    });

  } catch (error) {
    console.error('❌ Error fetching vendor orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: error.message },
      { status: 500 }
    );
  }
}

// ✅ UPDATED: PUT method with confirmed status support
export async function PUT(request) {
  try {
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'vendor' && user.role !== 'restaurant') {
      return NextResponse.json({ error: 'Access denied. Vendor role required.' }, { status: 403 });
    }

    const { orderId, status, estimatedTime } = await request.json();
    
    // ✅ FIXED: Add 'confirmed' to valid statuses
    const validStatuses = ['placed', 'confirmed', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
    
    if (!orderId || !status || !validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid data. Valid statuses: ' + validStatuses.join(', ') 
      }, { status: 400 });
    }

    await connectDB();

    // Get the vendor profile to find actual vendor ID
    const vendorProfile = await VendorProfile.findOne({ userId: user._id });
    
    if (!vendorProfile) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 400 });
    }

    const actualVendorId = vendorProfile._id;

    // Use actual vendor ID in query
    const order = await Order.findOne({ _id: orderId, vendorId: actualVendorId });
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found or access denied' }, { status: 404 });
    }

    console.log(`🔄 Updating order ${orderId} status from ${order.status} to ${status}`);

    const updateData = { 
      status,
      updatedAt: new Date()
    };
    
    // ✅ ADDED: Handle confirmed status timestamp
    switch (status) {
      case 'confirmed':
        updateData.confirmedAt = new Date();
        break;
      case 'ready':
        updateData.readyAt = new Date();
        if (estimatedTime) {
          updateData.estimatedDeliveryTime = new Date(Date.now() + estimatedTime * 60 * 1000);
        }
        break;
      case 'out_for_delivery':
        updateData.pickedUpAt = new Date();
        break;
      case 'delivered':
        updateData.deliveredAt = new Date();
        break;
      case 'cancelled':
        updateData.cancelledAt = new Date();
        break;
    }

    const updatedOrder = await Order.findByIdAndUpdate(orderId, updateData, { new: true });

    console.log(`✅ Order ${orderId} updated to ${status}`);

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: `Order ${status} successfully`
    });

  } catch (error) {
    console.error('❌ Error updating order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order', details: error.message },
      { status: 500 }
    );
  }
}
