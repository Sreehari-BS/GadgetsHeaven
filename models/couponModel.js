const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  discountType: {
    type: String,
    enum: ['Percentage', 'Fixed'],
    required: true,
  },
  discountValue: {
    type: Number,
    required: true,
  },
  minimumOrderAmount: {
    type: Number,
    required: true,
  },
  maximumDiscountAmount: {
    type: Number,
    required: true,
  },
  validityStart: {
    type: Date,
    required: true,
  },
  validityEnd: {
    type: Date,
    required: true,
  },
  usageLimit: {
    type: Number,
    required: true,
  },
  usedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  }],
  totalUsageCount: {
    type: Number,
    default: 0,
  },
  is_active: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model('Coupon', couponSchema);
