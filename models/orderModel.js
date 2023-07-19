const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  cart: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cart',
    required: true,
  },
  purchasedProducts: [{
    userName: {
      type: String,
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    address: {
      name: {
        type: String,
      },
      houseName: {
        type: String,
      },
      place: {
        type: String,
      },
      city: {
        type: String,
      },
      district: {
        type: String,
      },
      state: {
        type: String,
      },
      pinCode: {
        type: String,
      },
      phoneNumber: {
        type: String,
      },
    },
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'],
      default: 'Pending',
    },
    date: {
      type: Date,
      required: true,
    },
    deliveredDate: {
      type: Date,
    },
    lastReturnDate: {
      type: Date,
    },
    returnedDate: {
      type: Date,
    },
    cancelledDate: {
      type: Date,
    },
  }],
  shippingAddress: [{
    name: {
      type: String,
      required: true,
    },
    houseName: {
      type: String,
      required: true,
    },
    place: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    district: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    pinCode: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
  }],
});

module.exports = mongoose.model('Order', orderSchema);
