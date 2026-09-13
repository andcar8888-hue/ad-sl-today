const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication middleware. Reads the `Authorization: Bearer <token>`
 * header, verifies the JWT, loads the current user from the database
 * (so a deleted/changed-role user cannot keep using a stale token) and
 * attaches it to `req.user`.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user no longer exists' });
    }

    // Re-checked on EVERY authenticated request (not just at login) so a
    // user blocked mid-session is cut off immediately, even if they're
    // still holding a JWT that was issued before they were blocked.
    if (user.blocked) {
      return res.status(403).json({ message: 'Your account has been blocked. Please contact support.' });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, invalid or expired token' });
  }
};

module.exports = protect;
