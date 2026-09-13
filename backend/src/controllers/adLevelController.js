const AdLevel = require('../models/AdLevel');
const Ad = require('../models/Ad');

// Fields an admin may change on an existing ad level via PATCH. Mirrors the
// `ADMIN_EDITABLE_FIELDS` pattern used in adController.js's updateAdAdmin —
// only fields actually present in the request body are assigned.
const AD_LEVEL_EDITABLE_FIELDS = ['name', 'price', 'durationDays', 'priority', 'isActive'];

/**
 * Public: list only active ad levels, in ascending priority order. Used by
 * the Post Ad wizard's ad-level picker so users never see a level the admin
 * has phased out.
 *
 * Route: GET /api/v1/ad-levels
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getAdLevels = async (req, res, next) => {
  try {
    const levels = await AdLevel.find({ isActive: true }).sort({ priority: 1 });
    return res.status(200).json({ levels });
  } catch (error) {
    return next(error);
  }
};

/**
 * Admin: list every ad level (active and inactive), for the "Ad Levels"
 * management tab and so the admin ad-edit panel can show a level an ad
 * currently references even if it has since been deactivated.
 *
 * Route: GET /api/v1/ad-levels/admin/all (protected, admin only)
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getAllAdLevelsAdmin = async (req, res, next) => {
  try {
    const levels = await AdLevel.find({}).sort({ priority: 1 });
    return res.status(200).json({ levels });
  } catch (error) {
    return next(error);
  }
};

/**
 * Admin: create a new ad level (a purchasable boost tier).
 *
 * Route: POST /api/v1/ad-levels (protected, admin only)
 * Body: { name, price, durationDays?, priority?, isActive? }
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const createAdLevel = async (req, res, next) => {
  try {
    const { name, price, durationDays, priority, isActive } = req.body;

    const existing = await AdLevel.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({ message: 'An ad level with this name already exists' });
    }

    const level = await AdLevel.create({
      name: name.trim(),
      price,
      durationDays: durationDays === undefined || durationDays === null ? null : durationDays,
      priority: priority === undefined ? 0 : priority,
      isActive: isActive === undefined ? true : isActive,
    });

    return res.status(201).json({ message: 'Ad level created', level });
  } catch (error) {
    return next(error);
  }
};

/**
 * Admin: edit an existing ad level's fields. Only fields actually present in
 * the request body are updated (same pattern as adController.js's
 * updateAdAdmin).
 *
 * Route: PATCH /api/v1/ad-levels/:id (protected, admin only)
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const updateAdLevel = async (req, res, next) => {
  try {
    const level = await AdLevel.findById(req.params.id);
    if (!level) {
      return res.status(404).json({ message: 'Ad level not found' });
    }

    if (req.body.name !== undefined) {
      const existing = await AdLevel.findOne({ name: req.body.name.trim(), _id: { $ne: level._id } });
      if (existing) {
        return res.status(409).json({ message: 'An ad level with this name already exists' });
      }
    }

    AD_LEVEL_EDITABLE_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) {
        level[field] = field === 'name' ? req.body[field].trim() : req.body[field];
      }
    });

    await level.save();

    return res.status(200).json({ message: 'Ad level updated', level });
  } catch (error) {
    return next(error);
  }
};

/**
 * Admin: delete an ad level. If no ad currently references it, it is
 * hard-deleted. Otherwise it is only deactivated (`isActive: false`) — a
 * hard delete would orphan `Ad.adLevel`, which is a required reference.
 *
 * Route: DELETE /api/v1/ad-levels/:id (protected, admin only)
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const deleteAdLevel = async (req, res, next) => {
  try {
    const level = await AdLevel.findById(req.params.id);
    if (!level) {
      return res.status(404).json({ message: 'Ad level not found' });
    }

    const adsUsingLevel = await Ad.countDocuments({ adLevel: level._id });
    if (adsUsingLevel === 0) {
      await AdLevel.findByIdAndDelete(level._id);
      return res.status(200).json({ message: 'Ad level deleted' });
    }

    level.isActive = false;
    await level.save();
    return res.status(200).json({
      message: 'Ad level is in use by existing ads — deactivated instead of deleted',
      deactivated: true,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAdLevels,
  getAllAdLevelsAdmin,
  createAdLevel,
  updateAdLevel,
  deleteAdLevel,
};
