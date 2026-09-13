const express = require('express');
const { body } = require('express-validator');
const {
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
} = require('../controllers/authController');
const validate = require('../middleware/validate');
const protect = require('../middleware/auth');
const { isManager, isAdmin } = require('../middleware/roles');

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

// --- admin_assistant+ user management (declared before "/:id"-style routes
// would matter — there are none here to shadow, but kept together) --------

// List all users (paginated, searchable by name/email) for the admin
// dashboard's Users tab.
router.get('/admin/users', protect, isManager, getAllUsersAdmin);

// Create a new user directly from the admin dashboard. `role` in the body
// is only ever honored for an actual `admin` caller — see the controller's
// JSDoc for the exact 403 boundary.
router.post(
  '/admin/users',
  protect,
  isManager,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('role')
      .optional()
      .isIn(['user', 'moderator', 'admin_assistant', 'admin'])
      .withMessage('Invalid role'),
  ],
  validate,
  createUserAdmin
);

// Edit another user's name/email/phone/role. See the controller's JSDoc for
// the self-role-change and admin-only-role-change guards.
router.patch(
  '/admin/users/:id',
  protect,
  isManager,
  [
    body('name').optional({ checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('phone').optional({ checkFalsy: true }).trim(),
    body('role')
      .optional()
      .isIn(['user', 'moderator', 'admin_assistant', 'admin'])
      .withMessage('Invalid role'),
  ],
  validate,
  updateUserAdmin
);

// Block/unblock a user. Body: { blocked: boolean }.
router.patch(
  '/admin/users/:id/block',
  protect,
  isManager,
  [body('blocked').isBoolean().withMessage('blocked must be a boolean')],
  validate,
  toggleUserBlock
);

// Admin only — the one user-management action admin_assistant must never
// reach.
router.delete('/admin/users/:id', protect, isAdmin, deleteUserAdmin);

module.exports = router;
