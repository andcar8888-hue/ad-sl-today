const express = require('express');
const authRoutes = require('./authRoutes');
const adRoutes = require('./adRoutes');
const checkoutRoutes = require('./checkoutRoutes');
const categoryRoutes = require('./categoryRoutes');
const adLevelRoutes = require('./adLevelRoutes');
const notificationRoutes = require('./notificationRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/ads', adRoutes);
router.use('/checkout', checkoutRoutes);
router.use('/categories', categoryRoutes);
router.use('/ad-levels', adLevelRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;
