// app/api/delivery-partner/orders/[action]/route.js
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

export async function POST(request, { params }) {
  try {
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'delivery_partner') {
      return NextResponse.json({ error: 'Access denied. Delivery partner role required.' }, { status: 403 });
    }

    const { action } = params;
    const { orderId, reason, location } = await request.json();

    await connectDB();

    const partner = await DeliveryPartner.findOne({ userId: user._id });
    if (!partner) {
      return NextResponse.json({ error: 'Partner profile not found' }, { status: 404 });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    let result = {};

    switch (action) {
      case 'accept':
        if (order.status !== 'assigned' || order.deliveryDetails.partnerId?.toString() !== partner._id.toString()) {
          return NextResponse.json({ error: 'Order not assigned to you' }, { status: 400 });
        }
        
        order.acceptByPartner();
        await order.save();
        
        result = {
          message: 'Order accepted successfully',
          orderStatus: order.status
        };
        break;

      case 'reject':
        if (order.status !== 'assigned' || order.deliveryDetails.partnerId?.toString() !== partner._id.toString()) {
          return NextResponse.json({ error: 'Order not assigned to you' }, { status: 400 });
        }
        
        order.rejectByPartner(partner._id, reason);
        await order.save();
        
        result = {
          message: 'Order rejected successfully',
          orderStatus: order.status
        };
        break;

      case 'pickup':
        if (order.status !== 'accepted' || order.deliveryDetails.partnerId?.toString() !== partner._id.toString()) {
          return NextResponse.json({ error: 'Order not ready for pickup' }, { status: 400 });
        }
        
        order.markPickedUp();
        await order.save();
        
        // Update partner stats
        partner.deliveryStats.totalDeliveries += 1;
        await partner.save();
        
        result = {
          message: 'Order marked as picked up',
          orderStatus: order.status
        };
        break;

      case 'start_delivery':
        if (order.status !== 'picked_up' || order.deliveryDetails.partnerId?.toString() !== partner._id.toString()) {
          return NextResponse.json({ error: 'Order not picked up yet' }, { status: 400 });
        }
        
        order.markOutForDelivery();
        await order.save();
        
        result = {
          message: 'Delivery started',
          orderStatus: order.status
        };
        break;

      case 'deliver':
        if (order.status !== 'out_for_delivery' || order.deliveryDetails.partnerId?.toString() !== partner._id.toString()) {
          return NextResponse.json({ error: 'Order not out for delivery' }, { status: 400 });
        }
        
        order.markDelivered();
        await order.save();
        
        // Update partner stats
        partner.deliveryStats.completedDeliveries += 1;
        partner.deliveryStats.totalEarnings += order.deliveryDetails.partnerEarnings;
        partner.deliveryStats.thisMonthDeliveries += 1;
        partner.deliveryStats.thisMonthEarnings += order.deliveryDetails.partnerEarnings;
        await partner.save();
        
        result = {
          message: 'Order delivered successfully',
          orderStatus: order.status,
          earnings: order.deliveryDetails.partnerEarnings
        };
        break;

      case 'update_location':
        if (location) {
          partner.currentLocation = {
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address,
            updatedAt: new Date()
          };
          await partner.save();
        }
        
        result = {
          message: 'Location updated successfully',
          currentLocation: partner.currentLocation
        };
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    console.log(`🚚 Partner ${partner.fullName} performed action: ${action} on order ${order.orderNumber}`);

    return NextResponse.json({
      success: true,
      order: order,
      ...result
    });

  } catch (error) {
    console.error(`❌ Error performing action ${params.action}:`, error);
    return NextResponse.json(
      { error: 'Failed to perform action', details: error.message },
      { status: 500 }
    );
  }
}
