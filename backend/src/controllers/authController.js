const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

/**
 * Register a new user.
 * Validates that the email is not already registered, hashes the
 * password with bcrypt, and returns a signed JWT along with the
 * (password-free) user profile.
 *
 * Route: POST /api/v1/auth/register
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = generateToken({ id: user._id, role: user.role });

    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        whatsappNumber: user.whatsappNumber,
        telegramUsername: user.telegramUsername,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Authenticate a user with email + password and issue a JWT.
 *
 * Route: POST /api/v1/auth/login
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // password has `select: false` on the schema, so it must be requested explicitly.
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken({ id: user._id, role: user.role });

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        whatsappNumber: user.whatsappNumber,
        telegramUsername: user.telegramUsername,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Return the currently authenticated user's profile.
 * Requires the `protect` auth middleware to have run first.
 *
 * Route: GET /api/v1/auth/me
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getMe = async (req, res) => {
  return res.status(200).json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      whatsappNumber: req.user.whatsappNumber,
      telegramUsername: req.user.telegramUsername,
      role: req.user.role,
      createdAt: req.user.createdAt,
    },
  });
};

// Fields a user is allowed to edit on their own profile. Deliberately
// excludes `email`/`role` — those must never be changed via this endpoint,
// even if present in the request body (silently ignored, not an error).
const PROFILE_EDITABLE_FIELDS = ['name', 'phone', 'whatsappNumber', 'telegramUsername'];

/**
 * Update the currently authenticated user's own profile. Only whitelisted
 * fields (name/phone/whatsappNumber/telegramUsername) are ever read from
 * the request body — `email`/`role` are never assigned here even if present.
 * Requires the `protect` auth middleware to have run first.
 *
 * Route: PATCH /api/v1/auth/me
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const updateProfile = async (req, res, next) => {
  try {
    PROFILE_EDITABLE_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) {
        req.user[field] = req.body[field];
      }
    });

    await req.user.save();

    return res.status(200).json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        whatsappNumber: req.user.whatsappNumber,
        telegramUsername: req.user.telegramUsername,
        role: req.user.role,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Change the currently authenticated user's password. Requires the correct
 * current password before a new one is set. Requires the `protect` auth
 * middleware to have run first.
 *
 * Route: PATCH /api/v1/auth/me/password
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // req.user (from `protect`) doesn't have `password` selected — re-fetch
    // it explicitly for this comparison.
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    return next(error);
  }
};

/**
 * Admin: list all registered users, for the admin dashboard's "manage
 * users" view. Passwords are never included (schema default `select: false`).
 *
 * Route: GET /api/v1/auth/admin/users (protected, admin only)
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getAllUsersAdmin = async (req, res, next) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ users });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  getAllUsersAdmin,
};
