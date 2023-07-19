const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  adminPhoneNumber: {
    type: Number,
    required: true,
  },
  adminPassword: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('Admin', adminSchema);
