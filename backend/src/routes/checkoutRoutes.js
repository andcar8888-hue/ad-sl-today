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
const { isManager } = require('../middleware/roles');

const router = express.Router();

// --- admin_assistant+ routes (declared before "/:adId" to avoid shadowing) -
// Order/payment management is admin_assistant-tier, not exposed to
// moderator per the role-hierarchy spec.
router.get('/admin/all', protect, isManager, getAllOrdersAdmin);
router.patch('/:id/confirm', protect, isManager, confirmOrderPayment);

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
