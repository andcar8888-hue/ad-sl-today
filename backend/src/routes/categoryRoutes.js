const express = require('express');
const { body } = require('express-validator');
const { getCategories, createCategory, deleteCategory } = require('../controllers/categoryController');
const validate = require('../middleware/validate');
const protect = require('../middleware/auth');
const { isManager, isAdmin } = require('../middleware/roles');

const router = express.Router();

// Public — used to populate the Post Ad form and search filters.
router.get('/', getCategories);

// admin_assistant+ — manage categories. Family-friendly categories only.
router.post(
  '/',
  protect,
  isManager,
  [body('name').trim().notEmpty().withMessage('Category name is required')],
  validate,
  createCategory
);
// Delete is admin-only — admin_assistant may create categories but never
// delete anything anywhere.
router.delete('/:id', protect, isAdmin, deleteCategory);

module.exports = router;
