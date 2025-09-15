// models/DeliveryPartner.js
import mongoose from 'mongoose';

const workingHoursSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: true
  },
  isWorking: {
    type: Boolean,
    default: true
  },
  startTime: {
    type: String,
    required: true,
    default: '09:00'
  },
  endTime: {
    type: String,
    required: true,
    default: '22:00'
  }
});

const deliveryPartnerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  fullName: {
    type: String,
    trim: true,
    default: ''
  },
  mobileNo: {
    type: String,
    default: ''
  },
  alternateNo: {
    type: String,
    default: ''
  },
  address: {
    street: {
      type: String,
      default: ''
    },
    city: {
      type: String,
      default: ''
    },
    state: {
      type: String,
      default: ''
    },
    pincode: {
      type: String,
      default: ''
    }
  },
  workingHours: [workingHoursSchema],
  vehicleDetails: {
    vehicleType: {
      type: String,
      enum: ['', 'bike', 'scooter', 'bicycle', 'car'],
      default: ''
    },
    vehicleNumber: {
      type: String,
      uppercase: true,
      default: ''
    },
    licenseNumber: {
      type: String,
      default: ''
    }
  },
  bankDetails: {
    accountHolderName: {
      type: String,
      default: ''
    },
    accountNumber: {
      type: String,
      default: ''
    },
    ifscCode: {
      type: String,
      uppercase: true,
      default: ''
    },
    bankName: {
      type: String,
      default: ''
    }
  },
  documents: {
    profilePhoto: {
      type: String // Cloudinary URL
    },
    licensePhoto: {
      type: String // Cloudinary URL
    },
    aadharPhoto: {
      type: String // Cloudinary URL
    }
  },
  deliveryZones: [{
    type: String
  }],
  isAvailable: {
    type: Boolean,
    default: false
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  currentLocation: {
    latitude: Number,
    longitude: Number,
    address: String,
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 0
    }
  },
  deliveryStats: {
    totalDeliveries: {
      type: Number,
      default: 0
    },
    completedDeliveries: {
      type: Number,
      default: 0
    },
    cancelledDeliveries: {
      type: Number,
      default: 0
    },
    totalEarnings: {
      type: Number,
      default: 0
    },
    thisMonthDeliveries: {
      type: Number,
      default: 0
    },
    thisMonthEarnings: {
      type: Number,
      default: 0
    }
  },
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'in_review', 'approved', 'rejected'],
    default: 'pending'
  },
  // ✅ ADDED: Verification tracking fields
  verifiedBy: {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VendorProfile' // ✅ FIXED: Should reference VendorProfile, not Vendor
    },
    vendorName: {
      type: String,
      default: ''
    },
    verifiedAt: {
      type: Date
    },
    reason: {
      type: String,
      default: ''
    }
  },
  rejectedBy: {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VendorProfile' // ✅ FIXED: Should reference VendorProfile, not Vendor
    },
    vendorName: {
      type: String,
      default: ''
    },
    rejectedAt: {
      type: Date
    },
    reason: {
      type: String,
      default: ''
    }
  },
  // ✅ ADDED: Verification history for tracking multiple verification attempts
  verificationHistory: [{
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VendorProfile' // ✅ FIXED: Should reference VendorProfile, not Vendor
    },
    vendorName: String,
    action: {
      type: String,
      enum: ['approved', 'rejected'] // ✅ CORRECT: These are the right enum values
    },
    reason: String,
    actionDate: {
      type: Date,
      default: Date.now
    }
  }],
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
deliveryPartnerSchema.methods.calculateCompletion = function() {
  const requiredFields = [
    { field: this.fullName, name: 'Full Name' },
    { field: this.mobileNo, name: 'Mobile Number' },
    { field: this.address?.street, name: 'Street Address' },
    { field: this.address?.city, name: 'City' },
    { field: this.address?.state, name: 'State' },
    { field: this.address?.pincode, name: 'Pincode' },
    { field: this.vehicleDetails?.vehicleType, name: 'Vehicle Type' },
    { field: this.vehicleDetails?.vehicleNumber, name: 'Vehicle Number' },
    { field: this.vehicleDetails?.licenseNumber, name: 'License Number' },
    { field: this.bankDetails?.accountHolderName, name: 'Account Holder Name' },
    { field: this.bankDetails?.accountNumber, name: 'Account Number' },
    { field: this.bankDetails?.ifscCode, name: 'IFSC Code' },
    { field: this.bankDetails?.bankName, name: 'Bank Name' }
  ];
  
  const completedFields = requiredFields.filter(item => 
    item.field && item.field.toString().trim()
  );
  
  const hasWorkingHours = this.workingHours && this.workingHours.length > 0;
  const hasDeliveryZones = this.deliveryZones && this.deliveryZones.length > 0;
  
  const totalRequired = requiredFields.length + 2;
  const totalCompleted = completedFields.length + (hasWorkingHours ? 1 : 0) + (hasDeliveryZones ? 1 : 0);
  
  const completionPercentage = Math.round((totalCompleted / totalRequired) * 100);
  
  this.isProfileComplete = completionPercentage >= 90;
  
  return {
    percentage: completionPercentage,
    isComplete: this.isProfileComplete,
    missingFields: this.getMissingFields(),
    completedFields: completedFields.length,
    totalRequired: totalRequired
  };
};

// Get missing fields
deliveryPartnerSchema.methods.getMissingFields = function() {
  const missing = [];
  
  if (!this.fullName || !this.fullName.trim()) missing.push('Full Name');
  if (!this.mobileNo || !this.mobileNo.trim()) missing.push('Mobile Number');
  if (!this.address?.street || !this.address.street.trim()) missing.push('Street Address');
  if (!this.address?.city || !this.address.city.trim()) missing.push('City');
  if (!this.address?.state || !this.address.state.trim()) missing.push('State');
  if (!this.address?.pincode || !this.address.pincode.trim()) missing.push('Pincode');
  if (!this.vehicleDetails?.vehicleType || !this.vehicleDetails.vehicleType.trim()) missing.push('Vehicle Type');
  if (!this.vehicleDetails?.vehicleNumber || !this.vehicleDetails.vehicleNumber.trim()) missing.push('Vehicle Number');
  if (!this.vehicleDetails?.licenseNumber || !this.vehicleDetails.licenseNumber.trim()) missing.push('License Number');
  if (!this.bankDetails?.accountHolderName || !this.bankDetails.accountHolderName.trim()) missing.push('Account Holder Name');
  if (!this.bankDetails?.accountNumber || !this.bankDetails.accountNumber.trim()) missing.push('Account Number');
  if (!this.bankDetails?.ifscCode || !this.bankDetails.ifscCode.trim()) missing.push('IFSC Code');
  if (!this.bankDetails?.bankName || !this.bankDetails.bankName.trim()) missing.push('Bank Name');
  if (!this.workingHours || this.workingHours.length === 0) missing.push('Working Hours');
  if (!this.deliveryZones || this.deliveryZones.length === 0) missing.push('Delivery Zones');
  
  return missing;
};

// Initialize default working hours
deliveryPartnerSchema.methods.initializeWorkingHours = function() {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  if (!this.workingHours || this.workingHours.length === 0) {
    this.workingHours = days.map(day => ({
      day,
      isWorking: true,
      startTime: '09:00',
      endTime: '22:00'
    }));
  }
};

// ✅ FIXED: Method to add verification action to history
deliveryPartnerSchema.methods.addVerificationAction = function(vendorId, vendorName, action, reason = '') {
  // ✅ FIXED: Convert frontend action to database enum value
  const enumAction = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action;
  
  console.log('🔧 Adding verification action:', {
    vendorId,
    vendorName,
    originalAction: action,
    enumAction,
    reason
  });

  // Add to history with correct enum value
  this.verificationHistory.push({
    vendorId,
    vendorName,
    action: enumAction, // ✅ Use converted enum value
    reason,
    actionDate: new Date()
  });

  // Update current verification status
  if (enumAction === 'approved') {
    this.verifiedBy = {
      vendorId,
      vendorName,
      verifiedAt: new Date(),
      reason
    };
    this.verificationStatus = 'approved';
    this.isVerified = true;
    
    // Clear rejection data
    this.rejectedBy = {
      vendorId: null,
      vendorName: '',
      rejectedAt: null,
      reason: ''
    };
  } else if (enumAction === 'rejected') {
    this.rejectedBy = {
      vendorId,
      vendorName,
      rejectedAt: new Date(),
      reason
    };
    this.verificationStatus = 'rejected';
    this.isVerified = false;
    
    // Clear verification data
    this.verifiedBy = {
      vendorId: null,
      vendorName: '',
      verifiedAt: null,
      reason: ''
    };
  }
};

// ✅ Method to check if partner can be verified by vendor
deliveryPartnerSchema.methods.canBeVerifiedBy = function(vendorPincodes) {
  if (!this.deliveryZones || !vendorPincodes) return false;
  
  // Check if there's any overlap between delivery zones and vendor pincodes
  return this.deliveryZones.some(zone => vendorPincodes.includes(zone));
};

// ✅ Method to get verification summary
deliveryPartnerSchema.methods.getVerificationSummary = function() {
  return {
    status: this.verificationStatus,
    isVerified: this.isVerified,
    verifiedBy: this.verifiedBy.vendorName || null,
    verifiedAt: this.verifiedBy.verifiedAt || null,
    rejectedBy: this.rejectedBy.vendorName || null,
    rejectedAt: this.rejectedBy.rejectedAt || null,
    totalVerificationAttempts: this.verificationHistory.length,
    lastAction: this.verificationHistory.length > 0 
      ? this.verificationHistory[this.verificationHistory.length - 1] 
      : null
  };
};

// Update timestamp on save
deliveryPartnerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const DeliveryPartner = mongoose.models.DeliveryPartner || mongoose.model('DeliveryPartner', deliveryPartnerSchema);

export default DeliveryPartner;
