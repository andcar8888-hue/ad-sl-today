const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    ad: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ad',
      required: true,
      unique: true, // one order per ad submission
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    // This only tracks the manual bank-transfer confirmation flow —
    // there is no real payment gateway involved.
    status: {
      type: String,
      enum: ['pending_payment', 'confirmed'],
      default: 'pending_payment',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
