const crypto = require('crypto');

// Characters chosen to avoid visually ambiguous glyphs (0/O, 1/I) when a
// user reads the code aloud or types it into WhatsApp.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/**
 * Generate a short, human-friendly unique code for an Order, e.g. "ADSL-7K4P9X".
 * Uniqueness against the database is enforced by the caller (retry on
 * duplicate key error) combined with the `unique` index on Order.userCode.
 *
 * @param {number} [length=6] - Number of random characters after the prefix.
 * @returns {string} Generated user code.
 */
const generateUserCode = (length = 6) => {
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return `ADSL-${code}`;
};

module.exports = generateUserCode;
