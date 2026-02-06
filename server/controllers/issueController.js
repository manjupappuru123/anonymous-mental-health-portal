const mongoose = require('mongoose');
const Issue = require('../models/Issue');
const Counselor = require('../models/Counselor');
const Notification = require('../models/Notification');
const generateAnonId = require('../utils/generateAnonId');
const { sendIssueAssignedEmail } = require('../utils/emailService');

// Submit Issue
exports.submitIssue = async (req, res, next) => {
  try {
    const { title, description, category, severity } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const anonId = generateAnonId();

    const issue = await Issue.create({
      anonId,
      title,
      description,
      category,
      severity: severity || 'Medium',
      status: 'Open'
    });

    res.status(201).json({
      success: true,
      anonId,
      issue
    });
  } catch (error) {
    next(error);
  }
};

// Get Issue by AnonId
exports.getIssueByAnonId = async (req, res, next) => {
  try {
    const { anonId } = req.params;

    const issue = await Issue.findOne({ anonId }).populate('assignedCounselor', 'name');
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    res.status(200).json({
      success: true,
      issue
    });
  } catch (error) {
    next(error);
  }
};

// Get all issues (Counselor only)
exports.getAllIssues = async (req, res, next) => {
  try {
    const { status, category } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;

    const issues = await Issue.find(filter).populate('assignedCounselor', 'name');

    res.status(200).json({
      success: true,
      count: issues.length,
      issues
    });
  } catch (error) {
    next(error);
  }
};

// Assign Issue to Counselor
exports.assignIssue = async (req, res, next) => {
  try {
    const { issueId } = req.params;
    const { counselorId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(issueId)) {
      return res.status(400).json({ success: false, message: 'Invalid issue id' });
    }

    if (!counselorId) {
      return res.status(400).json({ success: false, message: 'Counselor ID is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(counselorId)) {
      return res.status(400).json({ success: false, message: 'Invalid counselor id' });
    }

    let issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    const counselor = await Counselor.findById(counselorId);
    if (!counselor || !counselor.isActive) {
      return res.status(404).json({ success: false, message: 'Counselor not found' });
    }

    const previousAssignedCounselor = issue.assignedCounselor;
    const previousStatus = issue.status;
    const alreadyAssigned =
      issue.assignedCounselor && issue.assignedCounselor.toString() === counselorId;

    issue.assignedCounselor = counselorId;
    issue.status = 'Assigned';
    issue = await issue.save();

    if (!alreadyAssigned) {
      try {
        await Notification.create({
          recipientCounselor: counselorId,
          type: 'IssueAssigned',
          issue: issue._id
        });
      } catch (notificationError) {
        issue.assignedCounselor = previousAssignedCounselor || null;
        issue.status = previousStatus || 'Open';
        await issue.save();
        return next(notificationError);
      }

      void sendIssueAssignedEmail({
        to: counselor.email,
        name: counselor.name,
        issueId: issue._id.toString()
      }).catch((emailError) => {
        console.error('Failed to send assignment email:', emailError.message);
      });
    }

    res.status(200).json({
      success: true,
      issue
    });
  } catch (error) {
    next(error);
  }
};

// Add Response to Issue
exports.addResponse = async (req, res, next) => {
  try {
    const { issueId } = req.params;
    const { response } = req.body;

    if (!response) {
      return res.status(400).json({ success: false, message: 'Please provide a response' });
    }

    let issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    issue.response = response;
    issue.status = 'Resolved';
    issue.updatedAt = Date.now();
    issue = await issue.save();

    res.status(200).json({
      success: true,
      issue
    });
  } catch (error) {
    next(error);
  }
};

// Delete Issue
exports.deleteIssue = async (req, res, next) => {
  try {
    const { issueId } = req.params;

    const issue = await Issue.findByIdAndDelete(issueId);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Issue deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
