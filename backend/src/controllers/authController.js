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

    // Checked AFTER the password match succeeds — checking earlier would
    // leak "this email belongs to a blocked account" to someone who
    // doesn't actually know the password.
    if (user.blocked) {
      return res.status(403).json({ message: 'Your account has been blocked. Please contact support.' });
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

// Shapes a Mongoose User document into the safe (no password hash) fields
// returned by every admin user-management endpoint below, consistent with
// the shape register/login/getMe already return (plus `blocked`, which the
// admin dashboard needs to render an Active/Blocked badge).
const toSafeUserAdmin = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  whatsappNumber: user.whatsappNumber,
  telegramUsername: user.telegramUsername,
  role: user.role,
  blocked: user.blocked,
  createdAt: user.createdAt,
});

/**
 * Admin (moderator+ via route, effectively admin_assistant+ since this route
 * is gated `isManager`): list all registered users, for the admin
 * dashboard's "manage users" view. Passwords are never included (schema
 * default `select: false`). Supports pagination and a case-insensitive
 * name/email search, the same response shape `getAds` already uses for
 * consistency across the admin dashboard.
 *
 * Route: GET /api/v1/auth/admin/users (protected, admin_assistant+)
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getAllUsersAdmin = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    const filter = {};
    if (search && search.trim()) {
      const term = search.trim();
      filter.$or = [
        { name: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Admin (admin_assistant+): create a new user directly from the admin
 * dashboard. Mirrors `register`'s email-uniqueness check + bcrypt hashing
 * pattern.
 *
 * `role` defaults to `'user'` when omitted. Because ANY role elevation is
 * reserved for a true `admin` (never just "elevated roles" — the whole
 * `role` field), an `admin_assistant` caller may never include `role` in the
 * body AT ALL, not even explicitly set to `'user'` — the simplest,
 * least-surprising boundary.
 *
 * Route: POST /api/v1/auth/admin/users (protected, admin_assistant+)
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const createUserAdmin = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (role !== undefined && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only an admin may set a user\'s role' });
    }

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
      role: role || 'user',
    });

    return res.status(201).json({ message: 'User created', user: toSafeUserAdmin(user) });
  } catch (error) {
    return next(error);
  }
};

// Fields an admin/admin_assistant may update on ANOTHER user via
// updateUserAdmin. `role` is handled separately below since it has its own
// extra guard (only a true `admin` may touch it, for anyone, including
// setting it to the same value it already has).
const USER_ADMIN_EDITABLE_FIELDS = ['name', 'phone'];

/**
 * Admin (admin_assistant+): update another user's name/email/phone/role.
 * Only fields actually present in the request body are changed (same
 * whitelist-and-assign pattern `updateProfile` uses for self-service edits).
 *
 * Guards, in this order:
 * 1. No self-role-change — a caller may never change their OWN `role`
 *    through this endpoint, regardless of what role they hold.
 * 2. `role` present at all (for ANY target user) requires the caller to
 *    actually be `admin` — not just "elevated roles", the field itself.
 * 3. Changing `email` requires it not already be taken by another user.
 *
 * Route: PATCH /api/v1/auth/admin/users/:id (protected, admin_assistant+)
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const updateUserAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isSelf = id === req.user._id.toString();

    if (isSelf && req.body.role !== undefined) {
      return res.status(403).json({ message: 'You cannot change your own role' });
    }

    if (req.body.role !== undefined && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only an admin may change a user\'s role' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.body.email !== undefined) {
      const newEmail = req.body.email.toLowerCase();
      const emailTaken = await User.findOne({ email: newEmail, _id: { $ne: id } });
      if (emailTaken) {
        return res.status(409).json({ message: 'An account with this email already exists' });
      }
      user.email = newEmail;
    }

    USER_ADMIN_EDITABLE_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    if (req.body.role !== undefined) {
      user.role = req.body.role;
    }

    await user.save();

    return res.status(200).json({ message: 'User updated', user: toSafeUserAdmin(user) });
  } catch (error) {
    return next(error);
  }
};

/**
 * Admin (admin_assistant+): block or unblock a user's account. A blocked
 * user cannot log in and, if already logged in, is cut off on their very
 * next authenticated request (`protect` re-checks `blocked` every time).
 *
 * Guard: no self-block — a caller may never block/unblock their OWN account
 * through this endpoint, regardless of what role they hold.
 *
 * Route: PATCH /api/v1/auth/admin/users/:id/block (protected, admin_assistant+)
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const toggleUserBlock = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
      return res.status(403).json({ message: 'You cannot block your own account' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.blocked = Boolean(req.body.blocked);
    await user.save();

    return res.status(200).json({ message: 'User updated', user: toSafeUserAdmin(user) });
  } catch (error) {
    return next(error);
  }
};

/**
 * Admin only: permanently delete a user account. This is the one
 * user-management action `admin_assistant` must never reach — gated
 * `isAdmin` (admin only) at the route level, not `isManager`.
 *
 * Guard: no self-delete — a caller may never delete their OWN account
 * through this endpoint, regardless of what role they hold.
 *
 * Deliberately does NOT cascade-delete the user's ads/orders/notifications
 * — removing an account shouldn't necessarily retract that person's live
 * listings, and every other part of this codebase already tolerates a
 * dangling `user` reference gracefully (ads/orders/notifications all
 * optionally-chain `?.name`/`?.email` when populating a user that no longer
 * exists).
 *
 * Route: DELETE /api/v1/auth/admin/users/:id (protected, admin only)
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const deleteUserAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
      return res.status(403).json({ message: 'You cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ message: 'User deleted' });
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
  createUserAdmin,
  updateUserAdmin,
  toggleUserBlock,
  deleteUserAdmin,
};
