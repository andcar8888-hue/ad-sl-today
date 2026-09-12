const multer = require('multer');

/**
 * 404 handler for unmatched routes.
 */
const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

/**
 * Centralised error handler. Normalises Multer upload errors, Mongoose
 * validation/cast errors, and unexpected errors into a consistent JSON
 * shape. Must be registered last, after all routes.
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'රූපයේ ප්‍රමාණය 400kb ට වඩා අඩුවෙන් උඩුගත කරන්න.',
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        message: 'උපරිම ඡායාරූප 3ක් උඩුගත කළ හැක. (Maximum 3 images allowed.)',
      });
    }
    return res.status(400).json({ message: err.message });
  }

  if (/image files are allowed/.test(err.message || '')) {
    return res.status(400).json({ message: err.message });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid identifier: ${err.value}` });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ message: `Duplicate value for ${field}` });
  }

  console.error('[error]', err);
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    message: err.message || 'Internal server error',
  });
};

module.exports = { notFound, errorHandler };
