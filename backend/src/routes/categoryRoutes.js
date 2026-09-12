const express = require('express');
const { body } = require('express-validator');
const { getCategories, createCategory, deleteCategory } = require('../controllers/categoryController');
const validate = require('../middleware/validate');
const protect = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

const router = express.Router();

// Public — used to populate the Post Ad form and search filters.
router.get('/', getCategories);

// Admin-only — manage categories. Family-friendly categories only.
router.post(
  '/',
  protect,
  isAdmin,
  [body('name').trim().notEmpty().withMessage('Category name is required')],
  validate,
  createCategory
);
router.delete('/:id', protect, isAdmin, deleteCategory);

module.exports = router;
