import mongoose from 'mongoose';

const vendorProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  restaurantName: {
    type: String,
    required: true,
    trim: true
  },
  restaurantPhoto: {
    type: String,
    default: null
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  mobileNo: {
    type: String,
    required: true,
    trim: true
  },
  fullAddress: {
    type: String,
    required: true,
    trim: true
  },
  pincode: {
    type: String,
    trim: true
  },
  deliveryPincodes: [{
    type: String
  }],
  
  // Simple restaurant operation fields
  isOpen: {
    type: Boolean,
    default: true,
    index: true
  },
  
  closureReason: {
    type: String,
    trim: true,
    default: null
  },
  
  workingHours: {
    type: String,
    default: '9:00 AM - 10:00 PM',
    trim: true
  },
  
  isProfileComplete: {
    type: Boolean,
    default: false
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

// Update the updatedAt field before saving
vendorProfileSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Simple index for better query performance
vendorProfileSchema.index({ isOpen: 1, city: 1 });

const VendorProfile = mongoose.models.VendorProfile || mongoose.model('VendorProfile', vendorProfileSchema);

export default VendorProfile;
