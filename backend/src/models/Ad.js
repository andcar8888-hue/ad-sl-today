const mongoose = require('mongoose');

// Ad lifecycle: draft -> pending_payment -> approved | rejected -> expired
const AD_STATUSES = ['draft', 'pending_payment', 'approved', 'rejected', 'expired'];

// Snapshot of an owner-submitted edit to an already-approved (live/public)
// ad, awaiting admin review. Typed (not Mixed) so `category` can be
// populated like any other ref. See `pendingChanges`/`hasPendingEdit` below
// for why this never touches `status`.
const pendingChangesSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    images: { type: [String], default: [] },
    city: { type: String, default: null },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    whatsappNumber: String,
    telegramUsername: { type: String, default: null },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

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
    // The boost tier the user chose (and paid for) at post time. Fully
    // admin-configurable via the AdLevel model — never hardcode a level's
    // name/id here, only reference it. Required because choosing a level is
    // now part of the Post Ad flow itself, not an admin-only edit.
    adLevel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdLevel',
      required: true,
    },
    // Admin-only flag to mark a listing as a known fake/scam ad, surfaced as
    // a plain warning label on the public card/detail views.
    isFake: {
      type: Boolean,
      default: false,
    },
    // Only meaningful for a durationDays-limited AdLevel (e.g. "Top Ad") —
    // set when the ad is approved (see approveAd) to `approvedAt + durationDays`.
    // null = never expires.
    expiresAt: {
      type: Date,
      default: null,
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
    // Deliberately separate from `status` — an owner-submitted edit to an
    // already-approved ad must NOT change what the public sees. The live ad
    // (all top-level fields, including `status`) stays exactly as-is until
    // an admin approves this pending snapshot; see adController's
    // submitEditRequest/approveEditRequest/rejectEditRequest.
    hasPendingEdit: {
      type: Boolean,
      default: false,
    },
    pendingChanges: {
      type: pendingChangesSchema,
      default: null,
    },
  },
  { timestamps: true }
);

// Support basic text search on title + description for the public listing endpoint.
adSchema.index({ title: 'text', description: 'text' });

adSchema.statics.STATUSES = AD_STATUSES;

module.exports = mongoose.model('Ad', adSchema);
