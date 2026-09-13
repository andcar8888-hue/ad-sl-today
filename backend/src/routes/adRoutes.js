const express = require('express');
const { body } = require('express-validator');
const {
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
} = require('../controllers/adController');
const validate = require('../middleware/validate');
const protect = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const { upload, MAX_AD_IMAGES } = require('../middleware/upload');

const router = express.Router();

const createAdValidators = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 120 }),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 5000 }),
  body('city').optional({ checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('City cannot exceed 100 characters'),
  body('whatsappNumber')
    .trim()
    .notEmpty()
    .withMessage('WhatsApp number is required')
    .custom((value) => value.replace(/\D/g, '').length >= 9)
    .withMessage('Please enter a valid WhatsApp number'),
  body('telegramUsername').optional({ checkFalsy: true }).trim(),
  body('category').notEmpty().withMessage('Category is required').isMongoId(),
  body('adLevel').notEmpty().withMessage('Ad level is required').isMongoId(),
];

const updateAdAdminValidators = [
  body('title').optional({ checkFalsy: true }).trim().isLength({ max: 120 }).withMessage('Title cannot exceed 120 characters'),
  body('description').optional({ checkFalsy: true }).trim().isLength({ max: 5000 }).withMessage('Description cannot exceed 5000 characters'),
  body('city').optional({ checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('City cannot exceed 100 characters'),
  body('whatsappNumber')
    .optional({ checkFalsy: true })
    .trim()
    .custom((value) => value.replace(/\D/g, '').length >= 9)
    .withMessage('Please enter a valid WhatsApp number'),
  body('telegramUsername').optional({ checkFalsy: true }).trim(),
  body('category').optional({ checkFalsy: true }).trim().isMongoId().withMessage('Invalid category id'),
  body('adLevel').optional({ checkFalsy: true }).isMongoId().withMessage('Invalid ad level id'),
  body('isFake').optional().isBoolean().withMessage('isFake must be a boolean'),
];

const removeAdImageValidators = [body('image').notEmpty().withMessage('image is required')];

// Same as createAdValidators MINUS `adLevel` — edits never touch ad
// level/pricing, that's a paid-tier decision tied to the original checkout,
// out of scope for the edit-request feature. Plus `existingImages`, the
// JSON-stringified array of kept image paths.
const editRequestValidators = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 120 }),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 5000 }),
  body('city').optional({ checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('City cannot exceed 100 characters'),
  body('whatsappNumber')
    .trim()
    .notEmpty()
    .withMessage('WhatsApp number is required')
    .custom((value) => value.replace(/\D/g, '').length >= 9)
    .withMessage('Please enter a valid WhatsApp number'),
  body('telegramUsername').optional({ checkFalsy: true }).trim(),
  body('category').notEmpty().withMessage('Category is required').isMongoId(),
  body('existingImages').optional().isJSON().withMessage('existingImages must be a JSON array'),
];

const rejectEditRequestValidators = [body('reason').optional({ checkFalsy: true }).trim()];

// --- Public routes ---------------------------------------------------------
router.get('/', getAds);

// --- Protected, user-specific routes (must be declared before "/:id") ------
router.get('/mine', protect, getMyAds);
router.get('/mine/:id', protect, getMyAdById);
router.post('/', protect, upload.array('images', MAX_AD_IMAGES), createAdValidators, validate, createAd);

// --- Admin-only routes (must be declared before "/:id") ---------------------
router.get('/admin/all', protect, isAdmin, getAllAdsAdmin);
router.get('/admin/pending-edits', protect, isAdmin, getPendingEditsAdmin);
router.patch('/:id/approve', protect, isAdmin, approveAd);
router.patch(
  '/:id/reject',
  protect,
  isAdmin,
  [body('reason').trim().notEmpty().withMessage('Rejection reason is required')],
  validate,
  rejectAd
);
router.patch('/:id/admin', protect, isAdmin, updateAdAdminValidators, validate, updateAdAdmin);
router.patch(
  '/:id/admin/images/remove',
  protect,
  isAdmin,
  removeAdImageValidators,
  validate,
  removeAdImage
);
router.patch('/:id/edit-request/approve', protect, isAdmin, approveEditRequest);
router.patch(
  '/:id/edit-request/reject',
  protect,
  isAdmin,
  rejectEditRequestValidators,
  validate,
  rejectEditRequest
);

// --- Protected, any authenticated user (must be declared before "/:id") -----
router.patch('/:id/like', protect, toggleLikeAd);
router.post(
  '/:id/edit-request',
  protect,
  upload.array('images', MAX_AD_IMAGES),
  editRequestValidators,
  validate,
  submitEditRequest
);

// --- Public single-ad lookup -------------------------------------------------
router.get('/:id', getAdById);

module.exports = router;
