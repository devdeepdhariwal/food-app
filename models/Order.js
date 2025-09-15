import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem', // We'll create this later
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  subtotal: {
    type: Number,
    required: true
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deliveryPartnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryPartner', // ✅ Changed to ref DeliveryPartner model
    default: null
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  // ✅ Enhanced status with delivery partner statuses
  status: {
    type: String,
    enum: [
      'placed',           // Customer placed order
      'confirmed',        // Restaurant confirmed
      'preparing',        // Restaurant preparing
      'ready',            // Food ready for pickup
      'assigned',         // Assigned to delivery partner
      'accepted',         // Partner accepted the order
      'picked_up',        // Partner picked up from restaurant
      'out_for_delivery', // On the way to customer
      'delivered',        // Successfully delivered
      'cancelled'         // Order cancelled
    ],
    default: 'placed'
  },
  customerDetails: {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    }
  },
  restaurantDetails: {
    name: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    }
  },
  // ✅ Enhanced delivery partner details
  deliveryDetails: {
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeliveryPartner',
      default: null
    },
    partnerName: {
      type: String,
      default: ''
    },
    partnerPhone: {
      type: String,
      default: ''
    },
    deliveryFee: {
      type: Number,
      default: 25 // Default delivery fee
    },
    partnerEarnings: {
      type: Number,
      default: 20 // Partner gets 20 out of 25 delivery fee
    },
    assignedAt: {
      type: Date
    },
    acceptedAt: {
      type: Date
    },
    rejectedBy: [{
      partnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryPartner'
      },
      rejectedAt: {
        type: Date,
        default: Date.now
      },
      reason: String
    }],
    distance: {
      type: Number, // Distance in km
      default: 0
    },
    estimatedPickupTime: {
      type: Date
    },
    actualPickupTime: {
      type: Date
    }
  },
  // ✅ Enhanced timestamps
  timestamps: {
    placedAt: {
      type: Date,
      default: Date.now
    },
    confirmedAt: {
      type: Date
    },
    preparingAt: {
      type: Date
    },
    readyAt: {
      type: Date
    },
    assignedAt: {
      type: Date
    },
    acceptedAt: {
      type: Date
    },
    pickedUpAt: {
      type: Date
    },
    deliveredAt: {
      type: Date
    },
    cancelledAt: {
      type: Date
    }
  },
  // ✅ Backward compatibility - keep existing fields
  estimatedDeliveryTime: {
    type: Date
  },
  placedAt: {
    type: Date,
    default: Date.now
  },
  readyAt: {
    type: Date
  },
  pickedUpAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  // ✅ Payment and tracking info
  paymentDetails: {
    method: {
      type: String,
      enum: ['cod', 'razorpay', 'card', 'upi', 'wallet'],
      default: 'cod'
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    razorpayOrderId: String,
    razorpayPaymentId: String
  },
  // ✅ Rating and feedback
  rating: {
    food: {
      type: Number,
      min: 1,
      max: 5
    },
    delivery: {
      type: Number,
      min: 1,
      max: 5
    },
    overall: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String,
    ratedAt: Date
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

// ✅ Methods for order status management
orderSchema.methods.assignToPartner = function(partnerId, partnerName, partnerPhone) {
  this.deliveryDetails.partnerId = partnerId;
  this.deliveryDetails.partnerName = partnerName;
  this.deliveryDetails.partnerPhone = partnerPhone;
  this.deliveryDetails.assignedAt = new Date();
  this.timestamps.assignedAt = new Date();
  this.status = 'assigned';
  this.deliveryPartnerId = partnerId; // For backward compatibility
};

orderSchema.methods.acceptByPartner = function() {
  this.deliveryDetails.acceptedAt = new Date();
  this.timestamps.acceptedAt = new Date();
  this.status = 'accepted';
};

orderSchema.methods.markPickedUp = function() {
  this.deliveryDetails.actualPickupTime = new Date();
  this.timestamps.pickedUpAt = new Date();
  this.pickedUpAt = new Date(); // For backward compatibility
  this.status = 'picked_up';
};

orderSchema.methods.markOutForDelivery = function() {
  this.status = 'out_for_delivery';
};

orderSchema.methods.markDelivered = function() {
  this.timestamps.deliveredAt = new Date();
  this.deliveredAt = new Date(); // For backward compatibility
  this.status = 'delivered';
};

orderSchema.methods.rejectByPartner = function(partnerId, reason = 'Not specified') {
  this.deliveryDetails.rejectedBy.push({
    partnerId,
    reason,
    rejectedAt: new Date()
  });
  
  // Clear current assignment
  this.deliveryDetails.partnerId = null;
  this.deliveryDetails.partnerName = '';
  this.deliveryDetails.partnerPhone = '';
  this.deliveryDetails.assignedAt = null;
  this.deliveryPartnerId = null;
  
  // Reset status to ready for reassignment
  this.status = 'ready';
};

// ✅ Calculate delivery earnings
orderSchema.methods.calculateDeliveryEarnings = function(distance = 0) {
  let baseFee = 25;
  let partnerShare = 20;
  
  // Increase fee for longer distances
  if (distance > 5) {
    baseFee += Math.ceil((distance - 5) * 5); // 5 rupees per extra km
    partnerShare = baseFee - 5; // Platform keeps 5 rupees
  }
  
  this.deliveryDetails.deliveryFee = baseFee;
  this.deliveryDetails.partnerEarnings = partnerShare;
  this.deliveryDetails.distance = distance;
};

// Generate unique order number
orderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderNumber = `ORD${timestamp}${random}`;
  }
  this.updatedAt = Date.now();
  next();
});

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

export default Order;
