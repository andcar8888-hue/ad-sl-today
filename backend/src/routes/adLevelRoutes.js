const express = require('express');
const { body } = require('express-validator');
const {
  getAdLevels,
  getAllAdLevelsAdmin,
  createAdLevel,
  updateAdLevel,
  deleteAdLevel,
} = require('../controllers/adLevelController');
const validate = require('../middleware/validate');
const protect = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

const router = express.Router();

// Shared validators for optional fields common to both create and update.
const commonOptionalValidators = [
  body('durationDays')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('durationDays must be a positive integer or null'),
  body('priority').optional({ checkFalsy: true }).isInt().withMessage('priority must be an integer'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

const createAdLevelValidators = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
  ...commonOptionalValidators,
];

const updateAdLevelValidators = [
  body('name').optional({ checkFalsy: true }).trim().notEmpty().withMessage('Name is required'),
  body('price').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
  ...commonOptionalValidators,
];

// --- Public routes ---------------------------------------------------------
router.get('/', getAdLevels);

// --- Admin-only routes (must be declared before "/:id") ---------------------
router.get('/admin/all', protect, isAdmin, getAllAdLevelsAdmin);
router.post('/', protect, isAdmin, createAdLevelValidators, validate, createAdLevel);
router.patch('/:id', protect, isAdmin, updateAdLevelValidators, validate, updateAdLevel);
router.delete('/:id', protect, isAdmin, deleteAdLevel);

module.exports = router;
