import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import VendorProfile from '@/models/VendorProfile';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    await connectDB();
    
    // Get user from token (assuming you have auth middleware)
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    
    const body = await request.json();
    const { isOpen, closureReason } = body;
    
    const vendorProfile = await VendorProfile.findOneAndUpdate(
      { userId },
      { 
        isOpen,
        closureReason: isOpen ? null : closureReason
      },
      { new: true }
    );
    
    if (!vendorProfile) {
      return NextResponse.json(
        { success: false, message: 'Vendor profile not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: isOpen ? 'Restaurant opened successfully' : 'Restaurant closed successfully',
      vendor: {
        isOpen: vendorProfile.isOpen,
        closureReason: vendorProfile.closureReason,
        workingHours: vendorProfile.workingHours
      }
    });
    
  } catch (error) {
    console.error('Toggle status error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update restaurant status' },
      { status: 500 }
    );
  }
}
