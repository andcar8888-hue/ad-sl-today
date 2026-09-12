const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT for an authenticated user.
 *
 * @param {{ id: string, role: string }} payload - Data to embed in the token.
 * @returns {string} Signed JWT.
 */
const generateToken = ({ id, role }) => {
  return jwt.sign({ userId: id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = generateToken;
