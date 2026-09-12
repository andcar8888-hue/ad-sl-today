const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe, getAllUsersAdmin } = require('../controllers/authController');
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

// Admin-only: list all users for the admin dashboard.
router.get('/admin/users', protect, isAdmin, getAllUsersAdmin);

module.exports = router;
