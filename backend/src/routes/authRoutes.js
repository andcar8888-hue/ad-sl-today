const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  getAllUsersAdmin,
} = require('../controllers/authController');
const validate = require('../middleware/validate');
const protect = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
  ],
  validate,
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

router.get('/me', protect, getMe);

router.patch(
  '/me',
  protect,
  [
    body('name')
      .optional({ checkFalsy: true })
      // Checked BEFORE .trim() below, on the raw value — express-validator's
      // optional({checkFalsy:true}) re-checks falsiness against the CURRENT
      // value before every subsequent chained method, so a whitespace-only
      // "   " would trim to "" and silently skip anything chained after
      // .trim() (including a .notEmpty() placed there), never producing a
      // clean validation error at all.
      .custom((value) => value.trim().length > 0)
      .withMessage('Name cannot be empty')
      .trim()
      .isLength({ max: 100 })
      .withMessage('Name cannot exceed 100 characters'),
    body('phone').optional({ checkFalsy: true }).trim(),
    body('whatsappNumber')
      .optional({ checkFalsy: true })
      .trim()
      .custom((value) => value.replace(/\D/g, '').length >= 9)
      .withMessage('Please enter a valid WhatsApp number'),
    body('telegramUsername').optional({ checkFalsy: true }).trim(),
  ],
  validate,
  updateProfile
);

router.patch(
  '/me/password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long'),
  ],
  validate,
  changePassword
);

// Admin-only: list all users for the admin dashboard.
router.get('/admin/users', protect, isAdmin, getAllUsersAdmin);

module.exports = router;
