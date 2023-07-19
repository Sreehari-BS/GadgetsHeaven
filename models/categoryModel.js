const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  categoryName: {
    type: String,
    required: true,
    unique: true,
  },
  categoryDescription: {
    type: String,
    required: true,
  },
  categoryImage: {
    type: String,
    required: true,
  },
  is_available: {
    type: Boolean,
    required: true,
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  }],
});

module.exports = mongoose.model('Category', categorySchema);
