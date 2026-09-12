const express = require('express');
const { body } = require('express-validator');
const {
  createAd,
  getAds,
  getAdById,
  getMyAds,
  getAllAdsAdmin,
  approveAd,
  rejectAd,
  updateAdAdmin,
  removeAdImage,
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
];

const removeAdImageValidators = [body('image').notEmpty().withMessage('image is required')];

// --- Public routes ---------------------------------------------------------
router.get('/', getAds);

// --- Protected, user-specific routes (must be declared before "/:id") ------
router.get('/mine', protect, getMyAds);
router.post('/', protect, upload.array('images', MAX_AD_IMAGES), createAdValidators, validate, createAd);

// --- Admin-only routes (must be declared before "/:id") ---------------------
router.get('/admin/all', protect, isAdmin, getAllAdsAdmin);
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

// --- Public single-ad lookup -------------------------------------------------
router.get('/:id', getAdById);

module.exports = router;
