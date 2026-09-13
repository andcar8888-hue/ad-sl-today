const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      // Never return the password hash in queries unless explicitly requested
      // with .select('+password') — e.g. during login.
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'moderator', 'admin_assistant', 'admin'],
      default: 'user',
    },
    // Blocked accounts cannot log in (checked in `login`) and any existing
    // JWT they're already holding is rejected on the very next authenticated
    // request (checked in the `protect` middleware), not just at the next
    // login attempt.
    blocked: { type: Boolean, default: false },
    phone: { type: String, trim: true, default: null },
    // Default WhatsApp/Telegram contact used to pre-fill new Post Ad submissions
    // — a convenience default, not authoritative; each ad still stores its own
    // whatsappNumber/telegramUsername independently and can differ from these.
    whatsappNumber: { type: String, trim: true, default: null },
    telegramUsername: { type: String, trim: true, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
