const mongoose = require('mongoose');

// Ad lifecycle: draft -> pending_payment -> approved | rejected -> expired
const AD_STATUSES = ['draft', 'pending_payment', 'approved', 'rejected', 'expired'];

const adSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    city: {
      type: String,
      trim: true,
      maxlength: [100, 'City cannot exceed 100 characters'],
      default: null,
    },
    // Local disk storage paths (e.g. "/uploads/ads/<filename>.jpg").
    // See backend/README.md for the image storage decision.
    images: {
      type: [String],
      default: [],
    },
    whatsappNumber: {
      type: String,
      required: [true, 'WhatsApp number is required'],
      trim: true,
    },
    telegramUsername: {
      type: String,
      trim: true,
      default: null,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: AD_STATUSES,
      default: 'draft',
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: null,
    },
    // Admin-only boost tier. Regular users cannot set this on creation —
    // only `updateAdAdmin` (via ADMIN_EDITABLE_FIELDS) may change it.
    adType: {
      type: String,
      enum: ['normal', 'featured', 'super'],
      default: 'normal',
    },
    // Incremented on every public detail view (see getAdById). No per-viewer
    // dedup — unlike likes, repeat views from the same visitor all count.
    views: {
      type: Number,
      default: 0,
    },
    // Denormalized count of `likedBy.length`, kept in sync on every toggle.
    // Exists as its own field (not a virtual) because the product spec calls
    // for a `likes` field directly.
    likes: {
      type: Number,
      default: 0,
    },
    // Per-user membership record backing `likes` — prevents the same user
    // from inflating the counter by repeat-toggling.
    likedBy: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
  },
  { timestamps: true }
);

// Support basic text search on title + description for the public listing endpoint.
adSchema.index({ title: 'text', description: 'text' });

adSchema.statics.STATUSES = AD_STATUSES;

module.exports = mongoose.model('Ad', adSchema);
