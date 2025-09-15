// app/api/customer/pincode/[pincode]/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Pincode from '@/models/Pincode';

export async function GET(request, { params }) {
  try {
    await dbConnect();
    
    const pincode = await Pincode.findOne({ pincode: params.pincode });
    
    if (!pincode) {
      return NextResponse.json(
        { success: false, message: 'Pincode not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      pincode: {
        pincode: pincode.pincode,
        city: pincode.city,
        state: pincode.state,
        district: pincode.district
      }
    });

  } catch (error) {
    console.error('Error validating pincode:', error);
    return NextResponse.json(
      { success: false, message: 'Error validating pincode' },
      { status: 500 }
    );
  }
}
