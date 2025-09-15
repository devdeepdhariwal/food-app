// app/api/customer/orders/route.js
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
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

// GET - Fetch customer orders
export async function GET(request) {
  try {
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get all orders for the customer
    const orders = await Order.find({ customerId: user._id })
      .sort({ createdAt: -1 }) // Most recent first
      .limit(50); // Limit to last 50 orders

    console.log(`📦 Found ${orders.length} orders for user:`, user._id);

    return NextResponse.json({
      success: true,
      orders: orders
    });

  } catch (error) {
    console.error('❌ Error fetching customer orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new order (FIXED VENDOR ID VERSION)
export async function POST(request) {
  try {
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      items,
      totalAmount,
      paymentMethod,
      deliveryAddress,
      customerDetails,
      restaurantId, // ✅ This should contain the actual vendor ID
      restaurantData // ✅ Add restaurant data from frontend
    } = await request.json();

    console.log('🎯 Creating order with data:', {
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      itemsCount: items?.length,
      totalAmount,
      paymentMethod,
      restaurantId, // ✅ Log this to verify it's correct
      restaurantData,
      deliveryAddress,
      customerDetails
    });

    // ✅ IMPORTANT: Validate that restaurantId is provided
    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 });
    }

    // Validate required fields
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 });
    }

    if (!totalAmount) {
      return NextResponse.json({ error: 'Total amount is required' }, { status: 400 });
    }

    if (!deliveryAddress) {
      return NextResponse.json({ error: 'Delivery address is required' }, { status: 400 });
    }

    await connectDB();

    // Import mongoose for ObjectId
    const mongoose = await import('mongoose');

    // ✅ Get user profile for complete customer info
    let userProfile = null;
    try {
      const UserProfile = (await import('@/models/UserProfile')).default;
      userProfile = await UserProfile.findOne({ userId: user._id });
      console.log('👤 User profile found:', userProfile ? 'Yes' : 'No');
    } catch (error) {
      console.log('⚠️ Could not fetch user profile:', error.message);
    }

    // Prepare order items with proper ObjectId
    const orderItems = items.map(item => ({
      menuItemId: new mongoose.Types.ObjectId(),
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.price * item.quantity
    }));

    // ✅ FIXED: Get customer name properly
    let customerName = 'Customer'; // Default fallback
    
    if (userProfile && userProfile.personalInfo) {
      // Try to get from user profile first
      const firstName = userProfile.personalInfo.firstName || '';
      const lastName = userProfile.personalInfo.lastName || '';
      if (firstName || lastName) {
        customerName = `${firstName} ${lastName}`.trim();
      }
    }
    
    // If profile doesn't have name, try from user object
    if (customerName === 'Customer' && user.name) {
      customerName = user.name;
    }
    
    // If customerDetails provided in request, use that
    if (customerDetails && customerDetails.name && customerDetails.name !== 'Customer') {
      customerName = customerDetails.name;
    }

    // ✅ FIXED: Get phone number properly
    let phoneNumber = ''; // Start empty
    
    // Priority order: customerDetails -> deliveryAddress -> userProfile -> user -> fallback
    if (customerDetails && customerDetails.phone) {
      phoneNumber = customerDetails.phone;
    } else if (deliveryAddress && deliveryAddress.phone) {
      phoneNumber = deliveryAddress.phone;
    } else if (userProfile && userProfile.personalInfo && userProfile.personalInfo.phone) {
      phoneNumber = userProfile.personalInfo.phone;
    } else if (user.phone) {
      phoneNumber = user.phone;
    } else {
      phoneNumber = '0000000000'; // Only use fallback if nothing else available
    }

    // ✅ FIXED: Get restaurant information
    let restaurantName = 'Restaurant';
    let restaurantAddress = 'Restaurant Address';
    
    if (restaurantData) {
      restaurantName = restaurantData.name || restaurantName;
      restaurantAddress = restaurantData.address || restaurantAddress;
    }

    // ✅ Generate orderNumber manually
    const orderNumber = `ORD${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    // ✅ FIXED: Use actual vendor ID instead of random ObjectId
    const orderData = {
      customerId: user._id,
      vendorId: restaurantId, // ✅ Use the actual restaurant/vendor ID from request
      items: orderItems,
      totalAmount: totalAmount,
      status: 'placed',
      orderNumber: orderNumber,
      customerDetails: {
        name: customerName, // ✅ FIXED: Proper customer name
        phone: phoneNumber, // ✅ FIXED: Proper phone number
        address: `${deliveryAddress.addressLine1}, ${deliveryAddress.addressLine2 ? deliveryAddress.addressLine2 + ', ' : ''}${deliveryAddress.city}, ${deliveryAddress.state} - ${deliveryAddress.pincode}`
      },
      restaurantDetails: {
        name: restaurantName, // ✅ FIXED: Use actual restaurant name
        address: restaurantAddress // ✅ FIXED: Use actual restaurant address
      },
      estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000),
      placedAt: new Date()
    };

    console.log('📋 Final order data with vendor ID:', {
      customerName,
      phoneNumber,
      restaurantName,
      orderNumber,
      vendorId: restaurantId // ✅ Log the vendor ID being used
    });

    // Create the order
    const order = new Order(orderData);
    await order.save();

    console.log('✅ Order created successfully with vendor ID:', order.vendorId);

    return NextResponse.json({
      success: true,
      orderId: order._id,
      orderNumber: order.orderNumber,
      vendorId: order.vendorId, // ✅ Return vendor ID for verification
      message: 'Order placed successfully'
    });

  } catch (error) {
    console.error('❌ Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order', details: error.message },
      { status: 500 }
    );
  }
}
