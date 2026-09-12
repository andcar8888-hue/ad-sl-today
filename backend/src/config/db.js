const mongoose = require('mongoose');

/**
 * Connect to MongoDB using Mongoose.
 *
 * On failure this logs the error and exits the process with a non-zero
 * status code rather than retrying in a crash loop — the process manager
 * (nodemon/pm2/docker) is responsible for restarts, not this function.
 *
 * @returns {Promise<void>} Resolves once the connection is established.
 */
const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('[db] MONGO_URI is not set. Please configure it in your .env file.');
    process.exit(1);
  }

  try {
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(mongoUri);
    console.log(`[db] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`[db] MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
