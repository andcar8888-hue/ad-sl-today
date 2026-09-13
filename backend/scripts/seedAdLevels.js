/**
 * One-off script to seed the standard set of ad levels (boost tiers) and
 * backfill any legacy Ad documents that still have the old `adType` field
 * instead of the new `adLevel` reference. Intentionally NOT run
 * automatically on server startup — run manually with
 * `npm run seed:ad-levels` whenever needed.
 *
 * Usage: node scripts/seedAdLevels.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const AdLevel = require('../src/models/AdLevel');
const Ad = require('../src/models/Ad');

// The standard, family-friendly boost tiers. Admins can rename/re-price
// these later via the Ad Levels management tab — this seed just establishes
// sane starting values.
const STARTER_AD_LEVELS = [
  { name: 'Normal', price: 900, durationDays: null, priority: 0 },
  { name: 'Featured', price: 1500, durationDays: null, priority: 1 },
  { name: 'Top Ad', price: 2000, durationDays: 2, priority: 2 },
];

const seed = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('[seed] MONGO_URI is not set. Please configure it in your .env file.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('[seed] Connected to MongoDB');

    const levelByName = {};
    for (const { name, price, durationDays, priority } of STARTER_AD_LEVELS) {
      // eslint-disable-next-line no-await-in-loop
      const result = await AdLevel.findOneAndUpdate(
        { name },
        { name, price, durationDays, priority },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      levelByName[name] = result;
      console.log(`[seed] Upserted ad level: ${result.name} (price: ${result.price}, durationDays: ${result.durationDays}, priority: ${result.priority})`);
    }

    // Migration: backfill any pre-existing Ad document that still has the
    // legacy `adType` field and no `adLevel` set yet.
    const normalLevel = levelByName.Normal;
    const featuredLevel = levelByName.Featured;
    const topAdLevel = levelByName['Top Ad'];
    const levelByOldType = {
      normal: normalLevel._id,
      featured: featuredLevel._id,
      super: topAdLevel._id,
    };

    const legacyAds = await Ad.find({ adLevel: { $exists: false } }).select('_id adType');
    for (const ad of legacyAds) {
      const newLevelId = levelByOldType[ad.adType] || normalLevel._id;
      // eslint-disable-next-line no-await-in-loop
      await Ad.updateOne({ _id: ad._id }, { $set: { adLevel: newLevelId }, $unset: { adType: '' } });
    }
    console.log(`[seed] Backfilled adLevel on ${legacyAds.length} legacy ad(s)`);

    console.log('[seed] Done.');
    process.exit(0);
  } catch (error) {
    console.error(`[seed] Failed: ${error.message}`);
    process.exit(1);
  }
};

seed();
