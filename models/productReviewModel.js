const mongoose = require('mongoose');

const productReviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  review: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'product',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    content: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now(),
    },
  }],
});

module.exports = mongoose.model('productReview', productReviewSchema);
