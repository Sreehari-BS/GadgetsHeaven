const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  offerTitle: {
    type: String,
    required: true,
  },
  offerType: {
    type: String,
    enum: ['Product_Offer', 'Category_Offer', 'Referral_Offer'],
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  },
  referralCode: {
    type: String,
  },
  offerDiscount: {
    type: Number,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  is_available: {
    type: Boolean,
    required: true,
  },
});

module.exports = mongoose.model('offer', offerSchema);
