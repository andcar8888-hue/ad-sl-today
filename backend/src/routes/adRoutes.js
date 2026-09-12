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
} = require('../controllers/adController');
const validate = require('../middleware/validate');
const protect = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const { upload } = require('../middleware/upload');

const router = express.Router();

const createAdValidators = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 120 }),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 5000 }),
  body('whatsappNumber').trim().notEmpty().withMessage('WhatsApp number is required'),
  body('telegramUsername').optional({ checkFalsy: true }).trim(),
  body('category').notEmpty().withMessage('Category is required').isMongoId(),
];

// --- Public routes ---------------------------------------------------------
router.get('/', getAds);

// --- Protected, user-specific routes (must be declared before "/:id") ------
router.get('/mine', protect, getMyAds);
router.post('/', protect, upload.array('images', Number(process.env.MAX_UPLOAD_FILES) || 6), createAdValidators, validate, createAd);

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

// --- Public single-ad lookup -------------------------------------------------
router.get('/:id', getAdById);

module.exports = router;
