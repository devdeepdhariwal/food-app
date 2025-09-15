// models/UserProfile.js
import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  type: {
    type: String,
    enum: ['home', 'work', 'other'],
    default: 'home'
  },
  label: {
    type: String,
    required: true // e.g., "Home", "Office", "Mom's Place"
  },
  addressLine1: {
    type: String,
    required: true
  },
  addressLine2: {
    type: String,
    default: ''
  },
  landmark: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  pincode: {
    type: String,
    required: true,
    match: /^\d{6}$/
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  personalInfo: {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true,
      match: /^\+?[1-9]\d{1,14}$/ // International phone format
    },
    dateOfBirth: {
      type: Date
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say']
    }
  },
  addresses: [addressSchema],
  preferences: {
    dietary: {
      type: [String],
      enum: ['vegetarian', 'vegan', 'gluten_free', 'dairy_free', 'nut_free'],
      default: []
    },
    cuisine: {
      type: [String],
      default: []
    },
    spiceLevel: {
      type: String,
      enum: ['mild', 'medium', 'hot', 'extra_hot'],
      default: 'medium'
    }
  },
  profileCompletion: {
    personalInfo: {
      type: Boolean,
      default: false
    },
    addressInfo: {
      type: Boolean,
      default: false
    },
    isComplete: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate profile completion
userProfileSchema.methods.calculateCompletion = function() {
  const personalComplete = !!(
    this.personalInfo.firstName &&
    this.personalInfo.lastName &&
    this.personalInfo.phone &&
    this.personalInfo.email
  );
  
  const addressComplete = this.addresses.length > 0;
  
  this.profileCompletion.personalInfo = personalComplete;
  this.profileCompletion.addressInfo = addressComplete;
  this.profileCompletion.isComplete = personalComplete && addressComplete;
  
  if (this.profileCompletion.isComplete && !this.profileCompletion.completedAt) {
    this.profileCompletion.completedAt = new Date();
  }
  
  return this.profileCompletion;
};

// Update timestamp on save
userProfileSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.calculateCompletion();
  next();
});

const UserProfile = mongoose.models.UserProfile || mongoose.model('UserProfile', userProfileSchema);

export default UserProfile;
