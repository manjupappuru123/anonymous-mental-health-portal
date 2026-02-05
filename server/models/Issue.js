const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  anonId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Academic', 'Personal', 'Mental Health', 'Financial', 'Relationship', 'Other'],
    required: true
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Open', 'Assigned', 'In Progress', 'Resolved'],
    default: 'Open'
  },
  assignedCounselor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Counselor',
    default: null
  },
  response: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Issue', issueSchema);
