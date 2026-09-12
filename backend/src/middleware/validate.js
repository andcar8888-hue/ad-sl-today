const { validationResult } = require('express-validator');

/**
 * Runs after an array of express-validator check() chains on a route.
 * If any validation failed, responds with 400 and a list of field errors;
 * otherwise passes control to the next handler.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map((err) => ({ field: err.path, message: err.msg })),
    });
  }
  return next();
};

module.exports = validate;
