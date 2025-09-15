import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb';
import Order from '../../../../../models/Order';
import { verifyToken } from '../../../../../lib/auth';

// Update order status
export async function PUT(request, { params }) {
  try {
    await connectDB();

    // Get token and verify user
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }

    const { orderId } = params;
    const { status } = await request.json();

    // Validate status
    const validStatuses = ['placed', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { message: 'Invalid order status' },
        { status: 400 }
      );
    }

    // Find order
    const order = await Order.findOne({ 
      _id: orderId, 
      vendorId: decoded.userId 
    });

    if (!order) {
      return NextResponse.json(
        { message: 'Order not found' },
        { status: 404 }
      );
    }

    // Update status and timestamps
    order.status = status;
    
    switch (status) {
      case 'ready':
        order.readyAt = new Date();
        break;
      case 'out_for_delivery':
        order.pickedUpAt = new Date();
        break;
      case 'delivered':
        order.deliveredAt = new Date();
        break;
    }

    await order.save();

    return NextResponse.json({
      message: 'Order status updated successfully',
      order: order
    });

  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get single order details
export async function GET(request, { params }) {
  try {
    await connectDB();

    // Get token and verify user
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }

    const { orderId } = params;

    const order = await Order.findOne({ 
      _id: orderId, 
      vendorId: decoded.userId 
    })
    .populate('customerId', 'name email')
    .populate('deliveryPartnerId', 'name email');

    if (!order) {
      return NextResponse.json(
        { message: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });

  } catch (error) {
    console.error('Get order error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
