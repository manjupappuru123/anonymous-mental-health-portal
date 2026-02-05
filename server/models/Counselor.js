const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const counselorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  specialization: {
    type: String,
    enum: ['Academic', 'Personal', 'Mental Health', 'Financial', 'Relationship', 'General'],
    default: 'General'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalIssuesHandled: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
counselorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
counselorSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Counselor', counselorSchema);
