import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { hashPassword } from '../../../../lib/auth';

export async function POST(request) {
  try {
    await connectDB();

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters long' },
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

    if (!user.isVerified) {
      return NextResponse.json(
        { message: 'Email not verified. Please verify your email first.' },
        { status: 400 }
      );
    }

    // Hash password and save
    const hashedPassword = await hashPassword(password);
    user.password = hashedPassword;
    await user.save();

    return NextResponse.json({
      message: 'Password set successfully. You can now login.'
    });

  } catch (error) {
    console.error('Set password error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
