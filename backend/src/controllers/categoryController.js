const Category = require('../models/Category');
const Ad = require('../models/Ad');

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
 * Admin: delete a category. If any ads still reference this category, the
 * admin must supply a `reassignTo` query param (a different, existing
 * category id) — those ads are bulk-reassigned to it before the category is
 * deleted. This is a deliberate product decision: never silently null out an
 * ad's category, and never hard-block the delete either.
 *
 * Route: DELETE /api/v1/categories/:id?reassignTo=<categoryId> (protected, admin only)
 *
 * Responses:
 * - 400 `{ message, adsCount }` if ads exist and no `reassignTo` was given.
 * - 400 `{ message }` if `reassignTo` equals the category being deleted, or
 *   does not resolve to an existing category.
 * - 200 `{ message: 'Category deleted' }` on success.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reassignTo } = req.query;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const adsCount = await Ad.countDocuments({ category: id });
    if (adsCount > 0) {
      if (!reassignTo) {
        return res.status(400).json({
          message: `This category has ${adsCount} ad(s). Choose a replacement category to move them into before deleting.`,
          adsCount,
        });
      }
      if (reassignTo === id) {
        return res
          .status(400)
          .json({ message: 'Replacement category must be different from the one being deleted' });
      }
      const replacement = await Category.findById(reassignTo);
      if (!replacement) {
        return res.status(400).json({ message: 'Replacement category not found' });
      }
      await Ad.updateMany({ category: id }, { category: replacement._id });
    }

    await Category.findByIdAndDelete(id);
    return res.status(200).json({ message: 'Category deleted' });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getCategories, createCategory, deleteCategory, slugify };
