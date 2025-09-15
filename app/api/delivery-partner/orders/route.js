// app/api/delivery-partner/orders/route.js
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import DeliveryPartner from '@/models/DeliveryPartner';
import Order from '@/models/Order';
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

// GET - Fetch orders for delivery partner
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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'available', 'assigned', 'active', 'completed'

    const partner = await DeliveryPartner.findOne({ userId: user._id });
    
    if (!partner) {
      return NextResponse.json({ error: 'Partner profile not found' }, { status: 404 });
    }

    let orders = [];

    switch (type) {
      case 'available':
        // Orders ready for pickup and not assigned to anyone
        orders = await Order.find({
          status: 'ready',
          'deliveryDetails.partnerId': null,
          // Only show orders not rejected by this partner
          'deliveryDetails.rejectedBy.partnerId': { $ne: partner._id }
        })
        .sort({ readyAt: 1 })
        .limit(20);
        break;

      case 'assigned':
        // Orders assigned to this partner but not accepted yet
        orders = await Order.find({
          'deliveryDetails.partnerId': partner._id,
          status: 'assigned'
        })
        .sort({ 'deliveryDetails.assignedAt': -1 });
        break;

      case 'active':
        // Orders accepted by this partner and in progress
        orders = await Order.find({
          'deliveryDetails.partnerId': partner._id,
          status: { $in: ['accepted', 'picked_up', 'out_for_delivery'] }
        })
        .sort({ 'deliveryDetails.acceptedAt': -1 });
        break;

      case 'completed':
        // Orders completed by this partner
        orders = await Order.find({
          'deliveryDetails.partnerId': partner._id,
          status: { $in: ['delivered'] }
        })
        .sort({ deliveredAt: -1 })
        .limit(50);
        break;

      default:
        // All orders for this partner
        orders = await Order.find({
          'deliveryDetails.partnerId': partner._id
        })
        .sort({ createdAt: -1 })
        .limit(100);
    }

    // Calculate statistics
    const stats = {
      available: await Order.countDocuments({
        status: 'ready',
        'deliveryDetails.partnerId': null,
        'deliveryDetails.rejectedBy.partnerId': { $ne: partner._id }
      }),
      assigned: await Order.countDocuments({
        'deliveryDetails.partnerId': partner._id,
        status: 'assigned'
      }),
      active: await Order.countDocuments({
        'deliveryDetails.partnerId': partner._id,
        status: { $in: ['accepted', 'picked_up', 'out_for_delivery'] }
      }),
      completed: await Order.countDocuments({
        'deliveryDetails.partnerId': partner._id,
        status: 'delivered'
      })
    };

    return NextResponse.json({
      success: true,
      orders,
      stats,
      partner: {
        id: partner._id,
        name: partner.fullName,
        isAvailable: partner.isAvailable,
        isOnline: partner.isOnline
      },
      message: `Found ${orders.length} orders`
    });

  } catch (error) {
    console.error('❌ Error fetching delivery partner orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: error.message },
      { status: 500 }
    );
  }
}
