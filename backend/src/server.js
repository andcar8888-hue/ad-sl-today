const path = require('path');
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const connectDB = require('./config/db');
const apiRoutes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { uploadRoot } = require('./middleware/upload');

const app = express();

// --- Core middleware ---------------------------------------------------------
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',') : '*',
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Serve locally uploaded ad images statically (see backend/README.md for
// the image storage decision).
app.use('/uploads', express.static(uploadRoot));

// --- Health check -------------------------------------------------------------
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'ad-sl-today-backend' });
});

// --- API routes ----------------------------------------------------------------
app.use('/api/v1', apiRoutes);

// --- 404 + error handling (must be last) ----------------------------------------
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

/**
 * Boot the HTTP server after establishing the MongoDB connection.
 * Connection failures are logged and exit the process (see src/config/db.js)
 * rather than starting the server in a broken state.
 */
const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[server] AD SL Today API listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
};

start();

module.exports = app;
