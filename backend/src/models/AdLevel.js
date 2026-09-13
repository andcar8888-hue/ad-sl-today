const mongoose = require('mongoose');

const adLevelSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, unique: true },
    price: { type: Number, required: [true, 'Price is required'], min: [0, 'Price cannot be negative'] },
    // null/unset = no special time-limited boost (e.g. Normal, Featured); set = the ad's
    // boosted visibility expires this many days after approval (e.g. 2 for "Top Ad").
    durationDays: { type: Number, default: null, min: [1, 'durationDays must be at least 1'] },
    // Higher priority sorts/highlights higher in the public listing. Needed because
    // AdLevels are fully admin-configurable (name/price can be renamed/changed at any
    // time) — sort/boost logic must never key off a level's *name* matching a hardcoded
    // string, only this explicit, stable priority number.
    priority: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdLevel', adLevelSchema);
