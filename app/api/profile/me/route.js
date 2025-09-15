// app/api/profile/me/route.js
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import UserProfile from '@/models/UserProfile';
import User from '@/models/User';
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

export async function GET(request) {
  try {
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    let profile = await UserProfile.findOne({ userId: user._id });
    
    if (!profile) {
      console.log('🔄 Creating new profile for user:', user._id);
      
      // Create minimal profile with only required fields
      profile = new UserProfile({
        userId: user._id,
        personalInfo: {
          firstName: user.name?.split(' ')[0] || '',
          lastName: user.name?.split(' ').slice(1).join(' ') || '',
          email: user.email || '',
          phone: '', // Empty string instead of undefined
          gender: '' // Empty string instead of undefined
        }
      });
      
      try {
        await profile.save();
        console.log('✅ New profile created successfully');
      } catch (saveError) {
        console.error('❌ Error saving new profile:', saveError);
        
        // If save fails, return minimal response
        return NextResponse.json({
          success: true,
          profile: {
            userId: user._id,
            personalInfo: {
              firstName: user.name?.split(' ')[0] || '',
              lastName: user.name?.split(' ').slice(1).join(' ') || '',
              email: user.email || '',
              phone: '',
              gender: ''
            },
            addresses: [],
            preferences: {
              dietary: [],
              cuisine: [],
              spiceLevel: 'medium'
            }
          },
          completion: {
            personalInfo: false,
            addressInfo: false,
            isComplete: false
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      profile: profile.toJSON(),
      completion: profile.profileCompletion
    });

  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    await connectDB();

    let profile = await UserProfile.findOne({ userId: user._id });
    
    if (!profile) {
      profile = new UserProfile({ 
        userId: user._id,
        personalInfo: {
          email: user.email || '',
          firstName: '',
          lastName: '',
          phone: '',
          gender: ''
        }
      });
    }

    // Update personal info
    if (data.personalInfo) {
      profile.personalInfo = { 
        ...profile.personalInfo.toObject(),
        ...data.personalInfo 
      };
    }

    // Update preferences
    if (data.preferences) {
      profile.preferences = { 
        ...profile.preferences.toObject(), 
        ...data.preferences 
      };
    }

    await profile.save();

    return NextResponse.json({
      success: true,
      profile: profile.toJSON(),
      completion: profile.profileCompletion
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile', details: error.message },
      { status: 500 }
    );
  }
}
