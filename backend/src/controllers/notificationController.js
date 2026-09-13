const Notification = require('../models/Notification');

// A regular user only ever sees notifications addressed to them personally.
// An admin sees their own personal notifications PLUS every admin-broadcast
// one (user: null) — this is the "admin sees all admin-relevant ones"
// scoping the product spec asks for, expressed as one shared filter reused
// by every endpoint below so listing/counting/marking-as-read all agree on
// what "belongs to this viewer" means.
function scopeFilter(user) {
  return user.role === 'admin' ? { $or: [{ user: user._id }, { user: null }] } : { user: user._id };
}

/**
 * List the authenticated viewer's notifications (personal ones, plus every
 * admin-broadcast notification if the viewer is an admin), newest first.
 *
 * Route: GET /api/v1/notifications (protected)
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find(scopeFilter(req.user))
      .populate('relatedAdId', 'title')
      .sort({ createdAt: -1 })
      .limit(50);
    return res.status(200).json({ notifications });
  } catch (error) {
    return next(error);
  }
};

/**
 * Count the authenticated viewer's unread notifications, for a navbar badge.
 *
 * Route: GET /api/v1/notifications/unread-count (protected)
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({ ...scopeFilter(req.user), read: false });
    return res.status(200).json({ count });
  } catch (error) {
    return next(error);
  }
};

/**
 * Mark a single notification (belonging to the viewer, per `scopeFilter`)
 * as read.
 *
 * Route: PATCH /api/v1/notifications/:id/read (protected)
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, ...scopeFilter(req.user) });
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    notification.read = true;
    await notification.save();
    return res.status(200).json({ message: 'Marked as read', notification });
  } catch (error) {
    return next(error);
  }
};

/**
 * Mark every notification belonging to the viewer as read.
 *
 * Route: PATCH /api/v1/notifications/read-all (protected)
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ ...scopeFilter(req.user), read: false }, { read: true });
    return res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getMyNotifications, getUnreadCount, markAsRead, markAllAsRead };
