// app/api/vendor/orders/stats/route.js
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import Order from '@/models/Order';
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

    const vendor = await Vendor.findOne({ userId: user._id });
    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Calculate stats
    const totalOrders = await Order.countDocuments({ 
      'restaurantDetails.vendorId': vendor._id 
    });

    const revenueResult = await Order.aggregate([
      { $match: { 'restaurantDetails.vendorId': vendor._id, status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const activeOrders = await Order.countDocuments({ 
      'restaurantDetails.vendorId': vendor._id,
      status: { $in: ['placed', 'confirmed', 'preparing', 'ready', 'out_for_delivery'] }
    });

    return NextResponse.json({
      success: true,
      totalOrders,
      totalRevenue: revenueResult[0]?.total || 0,
      activeOrders
    });

  } catch (error) {
    console.error('❌ Error fetching orders stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: error.message },
      { status: 500 }
    );
  }
}
