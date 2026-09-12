const express = require('express');
const { body } = require('express-validator');
const {
  createCheckout,
  getCheckoutByAd,
  getAllOrdersAdmin,
  confirmOrderPayment,
} = require('../controllers/checkoutController');
const validate = require('../middleware/validate');
const protect = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

const router = express.Router();

// --- Admin routes (declared before "/:adId" to avoid shadowing) ------------
router.get('/admin/all', protect, isAdmin, getAllOrdersAdmin);
router.patch('/:id/confirm', protect, isAdmin, confirmOrderPayment);

// --- User routes -------------------------------------------------------------
router.post(
  '/',
  protect,
  [body('adId').notEmpty().withMessage('adId is required').isMongoId()],
  validate,
  createCheckout
);
router.get('/:adId', protect, getCheckoutByAd);

module.exports = router;
