import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { generateOTP, sendOTPEmail } from '../../../../utils/emailService';

export async function POST(request) {
  try {
    await connectDB();

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { message: 'User is already verified' },
        { status: 400 }
      );
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.otpCode = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    const emailResult = await sendOTPEmail(email, otp, user.name);
    
    if (!emailResult.success) {
      return NextResponse.json(
        { message: 'Failed to send OTP email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'New OTP sent to your email' 
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
