const mongoose = require('mongoose');
const Issue = require('../models/Issue');
const Message = require('../models/Message');
const { hashStudentToken } = require('../utils/studentChatToken');

const MAX_MESSAGE_LENGTH = 5000;

const normalizeMessageBody = (body) => {
  if (typeof body !== 'string') {
    return { value: null, error: 'Message body is required' };
  }
  const trimmed = body.trim();
  if (!trimmed) {
    return { value: null, error: 'Message body is required' };
  }
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return {
      value: null,
      error: `Message body must be ${MAX_MESSAGE_LENGTH} characters or fewer`
    };
  }
  return { value: trimmed, error: null };
};

const getIssueById = async (issueId) => {
  if (!mongoose.Types.ObjectId.isValid(issueId)) {
    const error = new Error('Invalid issue id');
    error.status = 400;
    throw error;
  }

  const issue = await Issue.findById(issueId).populate('assignedCounselor', 'name');
  if (!issue) {
    const error = new Error('Issue not found');
    error.status = 404;
    throw error;
  }

  return issue;
};

const authorizeStudentToken = async (issueId, token) => {
  if (!token || typeof token !== 'string') {
    const error = new Error('Student token is required');
    error.status = 401;
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(issueId)) {
    const error = new Error('Invalid issue id');
    error.status = 400;
    throw error;
  }

  const issue = await Issue.findById(issueId)
    .select('+studentChatTokenHash')
    .populate('assignedCounselor', 'name');
  if (!issue) {
    const error = new Error('Issue not found');
    error.status = 404;
    throw error;
  }
  if (!issue.studentChatTokenHash) {
    const error = new Error('Student chat access is not enabled for this issue');
    error.status = 403;
    throw error;
  }

  const tokenHash = hashStudentToken(token);
  if (tokenHash !== issue.studentChatTokenHash) {
    const error = new Error('Invalid student token');
    error.status = 401;
    throw error;
  }

  return issue;
};

const authorizeCounselorIssue = async (issueId, counselorId) => {
  const issue = await getIssueById(issueId);

  if (!issue.assignedCounselor || issue.assignedCounselor._id.toString() !== counselorId) {
    const error = new Error('You are not assigned to this issue');
    error.status = 403;
    throw error;
  }

  return issue;
};

const createChatMessage = async ({ issue, issueId, senderType, senderCounselorId, body }) => {
  const { value, error } = normalizeMessageBody(body);
  if (error) {
    const err = new Error(error);
    err.status = 400;
    throw err;
  }

  const resolvedIssueId = issue?._id || issueId;

  const message = await Message.create({
    issueId: resolvedIssueId,
    senderType,
    senderCounselorId: senderCounselorId || null,
    body: value
  });

  if (issue) {
    issue.updatedAt = Date.now();
    await issue.save();
  } else {
    await Issue.findByIdAndUpdate(resolvedIssueId, { updatedAt: Date.now() });
  }

  return message;
};

module.exports = {
  normalizeMessageBody,
  getIssueById,
  authorizeStudentToken,
  authorizeCounselorIssue,
  createChatMessage
};
