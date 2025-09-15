import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb';
import MenuItem from '../../../../../models/MenuItem';
import { verifyToken } from '../../../../../lib/auth';

// GET single menu item
export async function GET(request, { params }) {
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

    const { itemId } = params;
    const menuItem = await MenuItem.findOne({ 
      _id: itemId, 
      vendorId: decoded.userId 
    });

    if (!menuItem) {
      return NextResponse.json(
        { message: 'Menu item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ menuItem });

  } catch (error) {
    console.error('Get menu item error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update menu item
export async function PUT(request, { params }) {
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

    const { itemId } = params;
    const updateData = await request.json();

    const updatedItem = await MenuItem.findOneAndUpdate(
      { _id: itemId, vendorId: decoded.userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return NextResponse.json(
        { message: 'Menu item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Menu item updated successfully',
      item: updatedItem
    });

  } catch (error) {
    console.error('Update menu item error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE menu item
export async function DELETE(request, { params }) {
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

    const { itemId } = params;
    const deletedItem = await MenuItem.findOneAndDelete({ 
      _id: itemId, 
      vendorId: decoded.userId 
    });

    if (!deletedItem) {
      return NextResponse.json(
        { message: 'Menu item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Menu item deleted successfully'
    });

  } catch (error) {
    console.error('Delete menu item error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
