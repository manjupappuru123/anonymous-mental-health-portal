const mongoose = require('mongoose');
const Notification = require('../models/Notification');

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
};

// Get notifications for current counselor
exports.getNotifications = async (req, res, next) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = Math.min(parsePositiveInt(req.query.limit, 20), 100);
    const skip = (page - 1) * limit;

    const filter = { recipientCounselor: req.user.id };

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('issue', 'category severity status')
        .lean(),
      Notification.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      page,
      limit,
      total,
      notifications
    });
  } catch (error) {
    next(error);
  }
};

// Get unread notification count
exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      recipientCounselor: req.user.id,
      isRead: false
    });

    res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    next(error);
  }
};

// Mark a notification as read
exports.markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ success: false, message: 'Invalid notification id' });
    }

    let notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipientCounselor: req.user.id, isRead: false },
      { isRead: true, readAt: new Date() },
      { new: true }
    ).populate('issue', 'category severity status');

    if (!notification) {
      notification = await Notification.findOne({
        _id: notificationId,
        recipientCounselor: req.user.id
      }).populate('issue', 'category severity status');
    }

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({
      success: true,
      notification
    });
  } catch (error) {
    next(error);
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { recipientCounselor: req.user.id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.status(200).json({
      success: true,
      updated: result.modifiedCount || 0
    });
  } catch (error) {
    next(error);
  }
};
