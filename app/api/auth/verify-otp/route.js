import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';

export async function POST(request) {
  try {
    await connectDB();

    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { message: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ 
      email: email.toLowerCase() 
    }).select('+otpCode +otpExpiry');

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

    if (!user.otpCode) {
      return NextResponse.json(
        { message: 'No OTP found. Please request a new one.' },
        { status: 400 }
      );
    }

    if (new Date() > user.otpExpiry) {
      return NextResponse.json(
        { message: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    if (user.otpCode !== otp.trim()) {
      return NextResponse.json(
        { message: 'Invalid OTP. Please try again.' },
        { status: 400 }
      );
    }

    user.isVerified = true;
    user.otpCode = undefined;
    user.otpExpiry = undefined;
    
    await user.save();

    return NextResponse.json({
      message: 'Email verified successfully! Your account is now active.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { message: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}
