const mongoose = require('mongoose');

// `user: null` means an admin-broadcast notification (visible to every
// admin), as opposed to a personal notification for one specific user —
// see notificationController.js's shared query filter for how these are
// scoped differently per viewer.
const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    type: { type: String, enum: ['edit_submitted', 'edit_approved', 'edit_rejected'], required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    relatedAdId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ad', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
