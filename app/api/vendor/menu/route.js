import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import MenuItem from '../../../../models/MenuItem';
import { verifyToken } from '../../../../lib/auth';

// GET all menu items for vendor
export async function GET(request) {
  try {
    await connectDB();

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

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    // Build query
    const query = { vendorId: decoded.userId };
    if (category && category !== 'all') {
      query.category = category;
    }
    if (search) {
      query.dishName = { $regex: search, $options: 'i' };
    }

    const menuItems = await MenuItem.find(query).sort({ category: 1, dishName: 1 });

    // Group by category
    const groupedMenu = menuItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});

    return NextResponse.json({
      menuItems,
      groupedMenu,
      total: menuItems.length
    });

  } catch (error) {
    console.error('Get menu items error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add multiple menu items
export async function POST(request) {
  try {
    await connectDB();

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

    const { items } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { message: 'Items array is required' },
        { status: 400 }
      );
    }

    // Validate and prepare items
    const menuItems = items.map(item => ({
      vendorId: decoded.userId,
      dishName: item.dishName,
      category: item.category,
      price: item.price,
      photo: item.photo || null,
      description: item.description || '',
      isVeg: item.isVeg !== undefined ? item.isVeg : true,
      preparationTime: item.preparationTime || 15,
      isAvailable: item.isAvailable !== undefined ? item.isAvailable : true
    }));

    // Insert multiple items
    const insertedItems = await MenuItem.insertMany(menuItems);

    return NextResponse.json({
      message: `${insertedItems.length} menu items added successfully`,
      items: insertedItems
    }, { status: 201 });

  } catch (error) {
    console.error('Add menu items error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
