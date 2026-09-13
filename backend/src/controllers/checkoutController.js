const mongoose = require('mongoose');
const Ad = require('../models/Ad');
const Order = require('../models/Order');
const generateUserCode = require('../utils/generateUserCode');

// Ad statuses that are still eligible to go through checkout.
const CHECKOUT_ELIGIBLE_STATUSES = ['pending_payment', 'draft'];

/**
 * Start checkout for one of the authenticated user's own ads.
 *
 * Generates a unique userCode and creates an Order record tied to that ad
 * (status "pending_payment"). Snapshots the ad's current AdLevel `name` and
 * `price` onto the Order at creation time — this snapshot is permanent and
 * deliberately never re-reads live AdLevel data, so a later admin price
 * change to that AdLevel can never retroactively alter what an already-
 * created order shows. Returns the manual bank-transfer details and the
 * WhatsApp number the user must send their payment receipt + userCode to.
 * No real payment gateway is involved — payment confirmation is a manual
 * admin action performed later in the admin dashboard.
 *
 * Route: POST /api/v1/checkout (protected)
 * Body: { adId: string }
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const createCheckout = async (req, res, next) => {
  try {
    const { adId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(adId)) {
      return res.status(400).json({ message: 'Invalid adId' });
    }

    const ad = await Ad.findById(adId).populate('adLevel');
    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    // Ownership check — a user may only check out their own ad submissions.
    if (ad.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not own this ad' });
    }

    if (!CHECKOUT_ELIGIBLE_STATUSES.includes(ad.status)) {
      return res.status(400).json({
        message: `Ad with status "${ad.status}" is not eligible for checkout`,
      });
    }

    const existingOrder = await Order.findOne({ ad: ad._id });
    if (existingOrder) {
      // Idempotent: if checkout was already started for this ad, return the
      // same order details instead of creating a duplicate.
      return res.status(200).json({
        message: 'Checkout already started for this ad',
        order: existingOrder,
        bankDetails: getBankDetails(),
      });
    }

    // Ensure the ad is marked pending_payment once checkout begins.
    if (ad.status === 'draft') {
      ad.status = 'pending_payment';
      await ad.save();
    }

    // Retry a handful of times in the extremely unlikely event of a
    // generated code colliding with an existing one (unique index).
    let order;
    for (let attempt = 0; attempt < 5 && !order; attempt += 1) {
      try {
        // eslint-disable-next-line no-await-in-loop
        order = await Order.create({
          ad: ad._id,
          user: req.user._id,
          userCode: generateUserCode(),
          adLevelName: ad.adLevel.name,
          price: ad.adLevel.price,
          status: 'pending_payment',
        });
      } catch (error) {
        if (error.code !== 11000 || attempt === 4) {
          throw error;
        }
      }
    }

    return res.status(201).json({
      message: 'Checkout created. Please complete the bank transfer and send your receipt.',
      order,
      bankDetails: getBankDetails(),
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Look up the checkout/order details for one of the authenticated user's
 * own ads, e.g. so the Checkout page can be revisited after a refresh.
 *
 * Route: GET /api/v1/checkout/:adId (protected)
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getCheckoutByAd = async (req, res, next) => {
  try {
    const { adId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(adId)) {
      return res.status(400).json({ message: 'Invalid adId' });
    }

    const order = await Order.findOne({ ad: adId }).populate('ad');
    if (!order) {
      return res.status(404).json({ message: 'No checkout found for this ad' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not own this order' });
    }

    return res.status(200).json({ order, bankDetails: getBankDetails() });
  } catch (error) {
    return next(error);
  }
};

/**
 * Admin: list every order (userCode + manual payment status) across all
 * users, for the admin dashboard's "submitted user codes/payments" view.
 *
 * Route: GET /api/v1/checkout/admin/all (protected, admin only)
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getAllOrdersAdmin = async (req, res, next) => {
  try {
    const orders = await Order.find({})
      .populate('ad', 'title status')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({ orders });
  } catch (error) {
    return next(error);
  }
};

/**
 * Admin: manually mark an order's bank-transfer payment as confirmed,
 * after verifying the receipt + userCode sent via WhatsApp outside the
 * app. This does not by itself approve the ad — approving/rejecting the
 * ad is a separate explicit admin action.
 *
 * Route: PATCH /api/v1/checkout/:id/confirm (protected, admin only)
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const confirmOrderPayment = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = 'confirmed';
    await order.save();

    return res.status(200).json({ message: 'Payment confirmed', order });
  } catch (error) {
    return next(error);
  }
};

/**
 * Reads the manual bank-transfer + WhatsApp receipt details from env vars.
 * @returns {{accountName: string, accountNumber: string, bankName: string, branch: string, whatsappNumber: string}}
 */
function getBankDetails() {
  return {
    accountName: process.env.BANK_ACCOUNT_NAME,
    accountNumber: process.env.BANK_ACCOUNT_NUMBER,
    bankName: process.env.BANK_NAME,
    branch: process.env.BANK_BRANCH,
    whatsappNumber: process.env.ADMIN_WHATSAPP_NUMBER,
  };
}

module.exports = {
  createCheckout,
  getCheckoutByAd,
  getAllOrdersAdmin,
  confirmOrderPayment,
};
