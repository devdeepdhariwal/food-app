import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { generateOTP, sendOTPEmail } from '../../../../utils/emailService';

export async function POST(request) {
  try {
    await connectDB();

    const { name, email, role } = await request.json();

    // Validate required fields
    if (!name || !email || !role) {
      return NextResponse.json(
        { message: 'Name, email, and role are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['admin', 'vendor', 'delivery_partner', 'customer'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { message: 'Invalid role selected' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      if (existingUser.isVerified) {
        return NextResponse.json(
          { message: 'User already exists and is verified' },
          { status: 400 }
        );
      } else {
        // User exists but not verified, update OTP and resend
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        existingUser.otpCode = otp;
        existingUser.otpExpiry = otpExpiry;
        existingUser.name = name;
        existingUser.role = role;
        
        await existingUser.save();

        // Send OTP email
        const emailResult = await sendOTPEmail(email, otp, name);
        
        if (!emailResult.success) {
          return NextResponse.json(
            { message: 'Failed to send OTP email' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          message: 'OTP sent to your email. Please verify to complete registration.',
          userId: existingUser._id
        });
      }
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Create new user
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase(),
      role,
      isVerified: false,
      otpCode: otp,
      otpExpiry
    });

    await newUser.save();

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, name);
    
    if (!emailResult.success) {
      await User.findByIdAndDelete(newUser._id);
      return NextResponse.json(
        { message: 'Failed to send OTP email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Registration initiated! Please check your email for OTP verification.',
      userId: newUser._id
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}
