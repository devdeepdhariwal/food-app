// app/api/delivery-partner/dashboard/route.js
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

    const partner = await DeliveryPartner.findOne({ userId: user._id });
    
    if (!partner) {
      return NextResponse.json({ error: 'Partner profile not found' }, { status: 404 });
    }

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Get this week's date range
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Calculate real-time stats
    const todayStats = await Order.aggregate([
      {
        $match: {
          'deliveryDetails.partnerId': partner._id,
          deliveredAt: { $gte: startOfDay, $lte: endOfDay }
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          earnings: { $sum: '$deliveryDetails.partnerEarnings' }
        }
      }
    ]);

    const weeklyStats = await Order.aggregate([
      {
        $match: {
          'deliveryDetails.partnerId': partner._id,
          deliveredAt: { $gte: startOfWeek }
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          earnings: { $sum: '$deliveryDetails.partnerEarnings' }
        }
      }
    ]);

    // Get recent orders
    const recentOrders = await Order.find({
      'deliveryDetails.partnerId': partner._id
    })
    .sort({ createdAt: -1 })
    .limit(5);

    const dashboardData = {
      partner: {
        id: partner._id,
        name: partner.fullName,
        phone: partner.mobileNo,
        isAvailable: partner.isAvailable,
        isOnline: partner.isOnline,
        // ✅ Fixed: Safe access to rating with defaults
        rating: partner.rating?.average || 0,
        totalRatings: partner.rating?.totalRatings || 0,
        profileCompletion: partner.calculateCompletion()
      },
      stats: {
        today: {
          deliveries: todayStats[0]?.count || 0,
          earnings: todayStats[0]?.earnings || 0
        },
        weekly: {
          deliveries: weeklyStats[0]?.count || 0,
          earnings: weeklyStats[0]?.earnings || 0
        },
        allTime: {
          deliveries: partner.deliveryStats?.completedDeliveries || 0,
          earnings: partner.deliveryStats?.totalEarnings || 0,
          rating: partner.rating?.average || 0
        }
      },
      currentOrders: {
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
        })
      },
      recentOrders: recentOrders.slice(0, 5)
    };

    return NextResponse.json({
      success: true,
      ...dashboardData
    });

  } catch (error) {
    console.error('❌ Error fetching delivery partner dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: error.message },
      { status: 500 }
    );
  }
}
