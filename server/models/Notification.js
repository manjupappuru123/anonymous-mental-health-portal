const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientCounselor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Counselor',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['IssueAssigned'],
    required: true
  },
  issue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue',
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

notificationSchema.index({ recipientCounselor: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
