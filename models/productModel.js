const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({

  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  offerPrice: {
    type: Number
  },
  images: [{
    type: String,
    required: true,
  }],
  quantity: {
    type: Number,
    required: true,
  },
  is_in_cart: {
    type: Number,
    required: true,
  },
  is_available: {
    type: Number,
    required: true,
  },

});

module.exports = mongoose.model('Product', productSchema);
