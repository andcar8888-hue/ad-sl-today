const Category = require('../models/Category');

/**
 * Turn a category name into a URL-friendly slug, e.g. "Home & Garden" -> "home-garden".
 * @param {string} name
 * @returns {string}
 */
const slugify = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

/**
 * Public: list all categories, used to populate the Post Ad form's
 * category select and the public search/filter UI.
 *
 * Route: GET /api/v1/categories
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 });
    return res.status(200).json({ categories });
  } catch (error) {
    return next(error);
  }
};

/**
 * Admin: create a new category. Family-friendly categories only — this
 * platform never adds adult/inappropriate categories.
 *
 * Route: POST /api/v1/categories (protected, admin only)
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const createCategory = async (req, res, next) => {
  try {
    const { name } = req.body;

    const existing = await Category.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({ message: 'Category already exists' });
    }

    const category = await Category.create({ name: name.trim(), slug: slugify(name) });
    return res.status(201).json({ message: 'Category created', category });
  } catch (error) {
    return next(error);
  }
};

/**
 * Admin: delete a category.
 *
 * Route: DELETE /api/v1/categories/:id (protected, admin only)
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    return res.status(200).json({ message: 'Category deleted' });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getCategories, createCategory, deleteCategory, slugify };
