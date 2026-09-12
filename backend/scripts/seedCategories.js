/**
 * One-off script to seed a small, family-friendly starter set of ad
 * categories. Intentionally NOT run automatically on server startup —
 * run manually with `npm run seed:categories` whenever needed.
 *
 * Usage: node scripts/seedCategories.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../src/models/Category');
const { slugify } = require('../src/controllers/categoryController');

// Family-friendly categories only — never add adult/inappropriate categories.
const STARTER_CATEGORIES = [
  'Vehicles',
  'Property',
  'Electronics',
  'Jobs',
  'Home & Garden',
  'Fashion',
  'Services',
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

    for (const name of STARTER_CATEGORIES) {
      // eslint-disable-next-line no-await-in-loop
      const result = await Category.findOneAndUpdate(
        { name },
        { name, slug: slugify(name) },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`[seed] Upserted category: ${result.name} (${result.slug})`);
    }

    console.log('[seed] Done.');
    process.exit(0);
  } catch (error) {
    console.error(`[seed] Failed: ${error.message}`);
    process.exit(1);
  }
};

seed();
