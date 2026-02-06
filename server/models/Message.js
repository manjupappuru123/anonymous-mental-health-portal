const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  issueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue',
    required: true,
    index: true
  },
  senderType: {
    type: String,
    enum: ['student', 'counselor'],
    required: true
  },
  senderCounselorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Counselor',
    default: null
  },
  body: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

messageSchema.index({ issueId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
