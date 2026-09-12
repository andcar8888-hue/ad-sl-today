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
        role: user.role,
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
        role: user.role,
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
      role: req.user.role,
    },
  });
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

module.exports = { register, login, getMe, getAllUsersAdmin };
