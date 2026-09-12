const mongoose = require('mongoose');
const path = require('path');
const Ad = require('../models/Ad');
const Category = require('../models/Category');

/**
 * Create a new ad submission for the authenticated user.
 *
 * Per the platform flow, submitting the Post Ad form immediately takes the
 * user to Checkout, so the ad is created directly with status
 * "pending_payment" rather than "draft" (draft remains available in the
 * schema for future use, e.g. an explicit "save as draft" feature).
 *
 * Route: POST /api/v1/ads (protected, multipart/form-data with `images[]`)
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const createAd = async (req, res, next) => {
  try {
    const { title, description, whatsappNumber, telegramUsername, category } = req.body;

    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    const imagePaths = (req.files || []).map(
      (file) => `/uploads/ads/${path.basename(file.path)}`
    );

    const ad = await Ad.create({
      title,
      description,
      whatsappNumber,
      telegramUsername: telegramUsername || null,
      category: categoryDoc._id,
      user: req.user._id,
      images: imagePaths,
      status: 'pending_payment',
    });

    return res.status(201).json({
      message: 'Ad submitted. Please proceed to checkout to complete payment.',
      ad,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Public listing of ads. Only ever returns ads with status "approved" —
 * pending/draft/rejected ads must never be exposed here.
 * Supports optional `category` (category id) and `search` (text search on
 * title/description) query params, plus basic pagination.
 *
 * Route: GET /api/v1/ads
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getAds = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;

    const filter = { status: 'approved' };

    if (category && mongoose.Types.ObjectId.isValid(category)) {
      filter.category = category;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const [ads, total] = await Promise.all([
      Ad.find(filter)
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Ad.countDocuments(filter),
    ]);

    return res.status(200).json({
      ads,
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
 * Public single-ad lookup by id. Only returns the ad if it is "approved" —
 * otherwise responds 404 so non-approved ads' existence is not leaked to
 * unauthenticated members of the public.
 *
 * Route: GET /api/v1/ads/:id
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getAdById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    const ad = await Ad.findOne({ _id: id, status: 'approved' })
      .populate('category', 'name slug')
      .populate('user', 'name');

    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    return res.status(200).json({ ad });
  } catch (error) {
    return next(error);
  }
};

/**
 * List the authenticated user's own ads, regardless of status, so they can
 * track their submission through the checkout / approval flow.
 *
 * Route: GET /api/v1/ads/mine (protected)
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getMyAds = async (req, res, next) => {
  try {
    const ads = await Ad.find({ user: req.user._id })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 });
    return res.status(200).json({ ads });
  } catch (error) {
    return next(error);
  }
};

/**
 * Admin: list every ad regardless of status, for the admin dashboard.
 * Supports an optional `status` filter query param.
 *
 * Route: GET /api/v1/ads/admin/all (protected, admin only)
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getAllAdsAdmin = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && Ad.STATUSES.includes(status)) {
      filter.status = status;
    }

    const ads = await Ad.find(filter)
      .populate('category', 'name slug')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({ ads });
  } catch (error) {
    return next(error);
  }
};

/**
 * Admin: approve an ad, making it publicly visible.
 *
 * Route: PATCH /api/v1/ads/:id/approve (protected, admin only)
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const approveAd = async (req, res, next) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    ad.status = 'approved';
    ad.rejectionReason = null;
    await ad.save();

    return res.status(200).json({ message: 'Ad approved', ad });
  } catch (error) {
    return next(error);
  }
};

/**
 * Admin: reject an ad with a required reason.
 *
 * Route: PATCH /api/v1/ads/:id/reject (protected, admin only)
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const rejectAd = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const ad = await Ad.findById(req.params.id);
    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    ad.status = 'rejected';
    ad.rejectionReason = reason;
    await ad.save();

    return res.status(200).json({ message: 'Ad rejected', ad });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createAd,
  getAds,
  getAdById,
  getMyAds,
  getAllAdsAdmin,
  approveAd,
  rejectAd,
};
