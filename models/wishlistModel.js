const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  wishList: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: {
      type: String,
    },
    is_in_wishlist: {
      type: Boolean,
      required: true,
    },
  }],
});

module.exports = mongoose.model('Wishlist', wishlistSchema);
