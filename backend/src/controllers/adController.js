const mongoose = require('mongoose');
const path = require('path');
const Ad = require('../models/Ad');
const Category = require('../models/Category');
const AdLevel = require('../models/AdLevel');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const { MAX_AD_IMAGES } = require('../middleware/upload');
const { computeExpiresAt, isBoostActive } = require('../utils/adLevel');
const { deleteAdImageFile } = require('../utils/adImages');

/**
 * Create a new ad submission for the authenticated user.
 *
 * Per the platform flow, submitting the Post Ad form immediately takes the
 * user to Checkout, so the ad is created directly with status
 * "pending_payment" rather than "draft" (draft remains available in the
 * schema for future use, e.g. an explicit "save as draft" feature).
 *
 * Accepts an optional `city` field (free-text, max 100 chars).
 *
 * `adLevel` is REQUIRED — the user chooses (and later pays for) their boost
 * tier as part of posting the ad itself, not as an admin-only edit. Must
 * reference an active AdLevel.
 *
 * Route: POST /api/v1/ads (protected, multipart/form-data with `images[]`)
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const createAd = async (req, res, next) => {
  try {
    const { title, description, city, whatsappNumber, telegramUsername, category, adLevel } = req.body;

    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    const adLevelDoc = await AdLevel.findById(adLevel);
    if (!adLevelDoc || !adLevelDoc.isActive) {
      return res.status(400).json({ message: 'Invalid ad level' });
    }

    const imagePaths = (req.files || []).map(
      (file) => `/uploads/ads/${path.basename(file.path)}`
    );

    const ad = await Ad.create({
      title,
      description,
      city: city || null,
      whatsappNumber,
      telegramUsername: telegramUsername || null,
      category: categoryDoc._id,
      adLevel: adLevelDoc._id,
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
 * Supports optional `category` (category id), `search` (text search on
 * title/description) and `city` (case-insensitive partial match) query
 * params, plus basic pagination.
 *
 * Boosted ads are surfaced first: any ad whose AdLevel has a positive
 * `priority` AND whose boost hasn't expired sorts ahead of non-boosted ads,
 * and within each of those two groups ads are ordered newest-first. Boost
 * rank is never keyed off a level's *name* — AdLevels are fully
 * admin-configurable — only off `priority`/`durationDays`/`expiresAt`.
 *
 * Route: GET /api/v1/ads
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getAds = async (req, res, next) => {
  try {
    const { category, search, city, page = 1, limit = 20 } = req.query;

    const filter = { status: 'approved' };

    if (category && mongoose.Types.ObjectId.isValid(category)) {
      filter.category = category;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    if (city && city.trim()) {
      filter.city = { $regex: city.trim(), $options: 'i' };
    }

    // Fetches the full filtered set into memory rather than paginating at
    // the DB level — acceptable at this app's current scale (the admin
    // listing below already does unpaginated full-collection fetches).
    const allMatching = await Ad.find(filter)
      .populate('category', 'name slug')
      .populate('adLevel')
      .sort({ createdAt: -1 })
      .lean();

    // Array.prototype.sort is a STABLE sort (guaranteed since ES2019 / all
    // current Node/V8) — since `allMatching` is already createdAt-desc,
    // sorting only by boost rank here preserves newest-first ordering
    // *within* each rank group for free.
    const boostRank = (ad) => (isBoostActive(ad) ? 0 : 1);
    allMatching.sort((a, b) => boostRank(a) - boostRank(b));

    const total = allMatching.length;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const ads = allMatching
      .slice((pageNum - 1) * limitNum, (pageNum - 1) * limitNum + limitNum)
      // Attach the computed boost flag so the frontend never has to
      // re-derive expiry logic itself (avoids client/server clock-skew
      // inconsistency).
      .map((ad) => ({ ...ad, boostActive: isBoostActive(ad) }));

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
 * Side effect: atomically increments the ad's `views` counter on every
 * call (increment-and-fetch, so there's no read-then-write race). No
 * per-viewer dedup — every call counts as a view.
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

    const ad = await Ad.findOneAndUpdate(
      { _id: id, status: 'approved' },
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate('category', 'name slug')
      .populate('adLevel')
      .populate('user', 'name')
      .lean();

    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    // Attach the computed boost flag — see getAds for why this is computed
    // server-side rather than left for the frontend to derive.
    return res.status(200).json({ ad: { ...ad, boostActive: isBoostActive(ad) } });
  } catch (error) {
    return next(error);
  }
};

/**
 * List the authenticated user's own ads, regardless of status, so they can
 * track their submission through the checkout / approval flow. Each ad is
 * enriched with its `userCode` and `orderStatus` from the associated Order,
 * if one exists.
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
      .populate('adLevel')
      .sort({ createdAt: -1 })
      .lean();

    const orders = await Order.find({ ad: { $in: ads.map((ad) => ad._id) } })
      .select('ad userCode status')
      .lean();
    const orderByAdId = new Map(orders.map((order) => [order.ad.toString(), order]));
    const adsWithCodes = ads.map((ad) => ({
      ...ad,
      userCode: orderByAdId.get(ad._id.toString())?.userCode || null,
      orderStatus: orderByAdId.get(ad._id.toString())?.status || null,
    }));

    return res.status(200).json({ ads: adsWithCodes });
  } catch (error) {
    return next(error);
  }
};

/**
 * Look up a single ad owned by the authenticated user, regardless of its
 * status (e.g. `pending_payment` or `rejected`, not just `approved`) — used
 * by the edit-ad page. Scoped to `req.user`, never a client-sent owner id.
 * Responds 404 for both "doesn't exist" and "isn't yours", so ad existence
 * is never leaked to a non-owner, consistent with the rest of this codebase.
 *
 * Route: GET /api/v1/ads/mine/:id (protected)
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getMyAdById = async (req, res, next) => {
  try {
    const ad = await Ad.findOne({ _id: req.params.id, user: req.user._id })
      .populate('category', 'name slug')
      .populate('adLevel')
      .populate('pendingChanges.category', 'name slug');

    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    return res.status(200).json({ ad });
  } catch (error) {
    return next(error);
  }
};

/**
 * Admin: list every ad regardless of status, for the admin dashboard.
 * Supports an optional `status` filter query param. Each ad is enriched
 * with its `userCode` and `orderStatus` from the associated Order, if one
 * exists.
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
      .populate('adLevel')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const orders = await Order.find({ ad: { $in: ads.map((ad) => ad._id) } })
      .select('ad userCode status')
      .lean();
    const orderByAdId = new Map(orders.map((order) => [order.ad.toString(), order]));
    const adsWithCodes = ads.map((ad) => ({
      ...ad,
      userCode: orderByAdId.get(ad._id.toString())?.userCode || null,
      orderStatus: orderByAdId.get(ad._id.toString())?.status || null,
    }));

    return res.status(200).json({ ads: adsWithCodes });
  } catch (error) {
    return next(error);
  }
};

/**
 * Admin: approve an ad, making it publicly visible. Also (re)computes
 * `expiresAt` from the ad's current AdLevel — if that level has a
 * `durationDays` boost window, the ad's boosted visibility expires that many
 * days from this approval moment; otherwise `expiresAt` is cleared to null.
 *
 * Route: PATCH /api/v1/ads/:id/approve (protected, admin only)
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const approveAd = async (req, res, next) => {
  try {
    const ad = await Ad.findById(req.params.id).populate('adLevel');
    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    ad.status = 'approved';
    ad.rejectionReason = null;
    ad.expiresAt = computeExpiresAt(ad.adLevel);
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

// Fields an admin is allowed to edit on an ad's content. Deliberately
// excludes `status`/`rejectionReason` — admin content edits must never
// change an ad's approval status. `adLevel`/`isFake` are admin-only-via-this-
// route edits of fields a regular user set (or couldn't set) at creation.
const ADMIN_EDITABLE_FIELDS = [
  'title',
  'description',
  'city',
  'whatsappNumber',
  'telegramUsername',
  'category',
  'adLevel',
  'isFake',
];

/**
 * Admin: edit an ad's content fields (title, description, city,
 * whatsappNumber, telegramUsername, category, adLevel, isFake). Only fields
 * actually present in the request body are updated. Never touches
 * `ad.status` — an approved ad remains approved after an edit.
 *
 * If `adLevel` is part of this edit, it must resolve to a real AdLevel
 * (being inactive is fine here — an admin may deliberately assign an ad to a
 * level they're phasing out). If the ad is currently `approved`, its
 * `expiresAt` is recomputed from the new level, consistent with `approveAd`'s
 * behavior; non-approved ads' `expiresAt` is left untouched by this route.
 *
 * Route: PATCH /api/v1/ads/:id/admin (protected, admin only)
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const updateAdAdmin = async (req, res, next) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    if (req.body.category !== undefined) {
      const categoryDoc = await Category.findById(req.body.category);
      if (!categoryDoc) {
        return res.status(400).json({ message: 'Invalid category' });
      }
    }

    let newAdLevelDoc;
    if (req.body.adLevel !== undefined) {
      newAdLevelDoc = await AdLevel.findById(req.body.adLevel);
      if (!newAdLevelDoc) {
        return res.status(400).json({ message: 'Invalid ad level' });
      }
    }

    ADMIN_EDITABLE_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) {
        ad[field] = req.body[field];
      }
    });

    // Recompute the boost expiry consistently with approveAd's behavior —
    // but only if this edit actually changed the level, and only for an ad
    // that's currently live (approved). Otherwise leave expiresAt untouched.
    if (newAdLevelDoc && ad.status === 'approved') {
      ad.expiresAt = computeExpiresAt(newAdLevelDoc);
    }

    await ad.save();

    return res.status(200).json({ message: 'Ad updated', ad });
  } catch (error) {
    return next(error);
  }
};

/**
 * Admin: remove a single image from an ad. The image must already be
 * present in the ad's `images` array (this also prevents deleting arbitrary
 * file paths). The database update is the source of truth; the on-disk file
 * is best-effort deleted afterwards.
 *
 * Route: PATCH /api/v1/ads/:id/admin/images/remove (protected, admin only)
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const removeAdImage = async (req, res, next) => {
  try {
    const { image } = req.body;

    const ad = await Ad.findById(req.params.id);
    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    if (!ad.images.includes(image)) {
      return res.status(400).json({ message: 'Image not found on this ad' });
    }

    ad.images = ad.images.filter((img) => img !== image);
    await ad.save();

    // Best-effort disk cleanup — DB is the source of truth, so failures here
    // are logged but never fail the request.
    deleteAdImageFile(image);

    return res.status(200).json({ message: 'Image removed', ad });
  } catch (error) {
    return next(error);
  }
};

/**
 * Toggle a like on an ad for the authenticated user. Idempotent per user —
 * liking is membership in `likedBy`, not a running counter, so repeat
 * toggles from the same user cannot inflate `likes` beyond 1. Any
 * authenticated user may like any ad (not admin-only).
 *
 * Route: PATCH /api/v1/ads/:id/like (protected)
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const toggleLikeAd = async (req, res, next) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    const userId = req.user._id.toString();
    const alreadyLiked = ad.likedBy.some((id) => id.toString() === userId);

    if (alreadyLiked) {
      ad.likedBy = ad.likedBy.filter((id) => id.toString() !== userId);
    } else {
      ad.likedBy.push(req.user._id);
    }
    ad.likes = ad.likedBy.length;
    await ad.save();

    return res.status(200).json({
      message: alreadyLiked ? 'Ad unliked' : 'Ad liked',
      liked: !alreadyLiked,
      likes: ad.likes,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Owner submits a content edit for one of their own ads.
 *
 * IMPORTANT: this never touches `ad.status`. If the ad is currently
 * "approved" (live/public), the edit is staged onto the separate
 * `pendingChanges` field and `hasPendingEdit` is flagged — the publicly
 * visible ad is completely untouched until an admin approves the edit (see
 * `getAds`/`getAdById`, which only ever return `status: 'approved'` ads
 * and read their top-level fields, never `pendingChanges`). For any other
 * status (draft/pending_payment/rejected/expired) nothing public is at
 * stake, so the edit is applied directly to the live ad.
 *
 * Images: `existingImages` (JSON array of image path strings the owner is
 * keeping) is filtered down to only paths that already exist on the ad, so
 * a client can never inject arbitrary/fabricated paths. Newly uploaded
 * files come through the same `upload.array('images', MAX_AD_IMAGES)`
 * middleware `createAd` uses.
 *
 * Route: POST /api/v1/ads/:id/edit-request (protected, multipart/form-data)
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const submitEditRequest = async (req, res, next) => {
  try {
    const { title, description, city, whatsappNumber, telegramUsername, category } = req.body;

    const ad = await Ad.findById(req.params.id);
    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    if (ad.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not own this ad' });
    }

    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    // Parse defensively — a malformed or missing existingImages should
    // never crash the request, just be treated as "keeping nothing".
    let requestedExisting;
    try {
      requestedExisting = JSON.parse(req.body.existingImages || '[]');
    } catch {
      requestedExisting = [];
    }
    if (!Array.isArray(requestedExisting)) {
      requestedExisting = [];
    }
    // Only allow paths that are genuinely already on this ad — prevents a
    // client from injecting arbitrary/fabricated image paths.
    const keptExisting = requestedExisting.filter((img) => ad.images.includes(img));

    const newImagePaths = (req.files || []).map(
      (file) => `/uploads/ads/${path.basename(file.path)}`
    );

    const finalImages = [...keptExisting, ...newImagePaths];

    if (finalImages.length > MAX_AD_IMAGES) {
      // The new files are already written to disk by multer at this point —
      // clean them up since we're rejecting this submission.
      newImagePaths.forEach(deleteAdImageFile);
      return res.status(400).json({
        message: 'උපරිම ඡායාරූප 3ක් උඩුගත කළ හැක. (Maximum 3 images allowed.)',
      });
    }

    if (ad.status === 'approved') {
      // The ad is live/public — do NOT touch any live field. Stage the edit
      // for admin review instead.
      if (ad.hasPendingEdit && ad.pendingChanges) {
        // A previous pending edit is being superseded by this new one —
        // clean up any of ITS images that only ever existed for that
        // now-discarded request (i.e. not part of the live ad or this new
        // submission), so they don't leak on disk.
        const stillReferenced = new Set([...ad.images, ...finalImages]);
        (ad.pendingChanges.images || [])
          .filter((img) => !stillReferenced.has(img))
          .forEach(deleteAdImageFile);
      }

      ad.pendingChanges = {
        title,
        description,
        city: city || null,
        category: categoryDoc._id,
        whatsappNumber,
        telegramUsername: telegramUsername || null,
        images: finalImages,
        submittedAt: new Date(),
      };
      ad.hasPendingEdit = true;
      await ad.save();

      await Notification.create({
        type: 'edit_submitted',
        user: null,
        message: `${req.user.name} submitted an edit for ad "${ad.title}"`,
        relatedAdId: ad._id,
      });

      return res.status(200).json({ message: 'Edit submitted for review', ad });
    }

    // Not live yet (draft/pending_payment/rejected/expired) — nothing
    // public is at stake, so apply the changes directly. Never touch
    // status/rejectionReason/pendingChanges/hasPendingEdit here.
    const oldImages = ad.images;
    ad.title = title;
    ad.description = description;
    ad.city = city || null;
    ad.category = categoryDoc._id;
    ad.whatsappNumber = whatsappNumber;
    ad.telegramUsername = telegramUsername || null;
    ad.images = finalImages;
    await ad.save();

    // Best-effort cleanup of any old images that got dropped from this edit.
    oldImages.filter((img) => !finalImages.includes(img)).forEach(deleteAdImageFile);

    return res.status(200).json({ message: 'Ad updated', ad });
  } catch (error) {
    return next(error);
  }
};

/**
 * Admin: list every ad with a pending edit awaiting review, with both the
 * live (top-level) fields and the staged `pendingChanges` populated so an
 * admin can compare old vs. new before approving/rejecting.
 *
 * Route: GET /api/v1/ads/admin/pending-edits (protected, admin only)
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getPendingEditsAdmin = async (req, res, next) => {
  try {
    const ads = await Ad.find({ hasPendingEdit: true })
      .populate('category', 'name slug')
      .populate('pendingChanges.category', 'name slug')
      .populate('user', 'name email')
      .sort({ 'pendingChanges.submittedAt': -1 });

    return res.status(200).json({ ads });
  } catch (error) {
    return next(error);
  }
};

/**
 * Admin: approve a pending edit, merging every field from `ad.pendingChanges`
 * onto the live ad. `ad.status` is never touched by this — an approved ad's
 * edit approval keeps it approved, it just now shows the new content.
 * Old live images no longer referenced by the new image set are best-effort
 * deleted from disk as genuinely orphaned.
 *
 * Route: PATCH /api/v1/ads/:id/edit-request/approve (protected, admin only)
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const approveEditRequest = async (req, res, next) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad || !ad.hasPendingEdit || !ad.pendingChanges) {
      return res.status(404).json({ message: 'No pending edit found for this ad' });
    }

    const oldImages = ad.images;
    const pending = ad.pendingChanges;

    ad.title = pending.title;
    ad.description = pending.description;
    ad.city = pending.city;
    ad.category = pending.category;
    ad.whatsappNumber = pending.whatsappNumber;
    ad.telegramUsername = pending.telegramUsername;
    ad.images = pending.images;

    ad.pendingChanges = null;
    ad.hasPendingEdit = false;
    await ad.save();

    // Old images no longer referenced by the new set are genuinely orphaned now.
    oldImages.filter((img) => !ad.images.includes(img)).forEach(deleteAdImageFile);

    await Notification.create({
      type: 'edit_approved',
      user: ad.user,
      message: 'ඔබගේ දැන්වීමට කළ වෙනස්කම් අනුමත කරන ලදී.',
      relatedAdId: ad._id,
    });

    return res.status(200).json({ message: 'Edit approved', ad });
  } catch (error) {
    return next(error);
  }
};

/**
 * Admin: reject a pending edit. The live ad and its images are completely
 * untouched — only images that existed solely for the now-discarded
 * pending request are best-effort deleted. `reason` is optional (unlike
 * `rejectAd`'s required reason for rejecting a whole ad).
 *
 * Route: PATCH /api/v1/ads/:id/edit-request/reject (protected, admin only)
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const rejectEditRequest = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const ad = await Ad.findById(req.params.id);
    if (!ad || !ad.hasPendingEdit || !ad.pendingChanges) {
      return res.status(404).json({ message: 'No pending edit found for this ad' });
    }

    // Only images that existed purely for this now-discarded pending
    // request (never part of the live ad) should be deleted.
    (ad.pendingChanges.images || [])
      .filter((img) => !ad.images.includes(img))
      .forEach(deleteAdImageFile);

    ad.pendingChanges = null;
    ad.hasPendingEdit = false;
    await ad.save();

    await Notification.create({
      type: 'edit_rejected',
      user: ad.user,
      message: reason
        ? `ඔබගේ දැන්වීමට කළ වෙනස්කම් ප්‍රතික්ෂේප කරන ලදී. හේතුව: ${reason}`
        : 'ඔබගේ දැන්වීමට කළ වෙනස්කම් ප්‍රතික්ෂේප කරන ලදී.',
      relatedAdId: ad._id,
    });

    return res.status(200).json({ message: 'Edit rejected', ad });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createAd,
  getAds,
  getAdById,
  getMyAds,
  getMyAdById,
  getAllAdsAdmin,
  approveAd,
  rejectAd,
  updateAdAdmin,
  removeAdImage,
  toggleLikeAd,
  submitEditRequest,
  getPendingEditsAdmin,
  approveEditRequest,
  rejectEditRequest,
};
