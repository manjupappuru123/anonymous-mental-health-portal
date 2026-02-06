const Issue = require('../models/Issue');
const Message = require('../models/Message');
const {
  authorizeStudentToken,
  authorizeCounselorIssue,
  createChatMessage
} = require('../services/chatService');
const { emitMessageNew } = require('../socket');

// Student: get thread metadata
exports.getStudentThread = async (req, res, next) => {
  try {
    const { issueId } = req.params;
    const token = req.query.t;

    const issue = await authorizeStudentToken(issueId, token);

    res.status(200).json({
      success: true,
      thread: {
        issueId: issue._id,
        status: issue.status,
        assignedCounselor: issue.assignedCounselor
          ? { id: issue.assignedCounselor._id, name: issue.assignedCounselor.name }
          : null
      }
    });
  } catch (error) {
    next(error);
  }
};

// Student: fetch messages
exports.getStudentMessages = async (req, res, next) => {
  try {
    const { issueId } = req.params;
    const token = req.query.t;

    await authorizeStudentToken(issueId, token);

    const messages = await Message.find({ issueId }).sort({ createdAt: 1 }).lean();

    const safeMessages = messages.map((message) => ({
      id: message._id,
      senderType: message.senderType,
      body: message.body,
      createdAt: message.createdAt
    }));

    res.status(200).json({
      success: true,
      messages: safeMessages
    });
  } catch (error) {
    next(error);
  }
};

// Student: send message
exports.createStudentMessage = async (req, res, next) => {
  try {
    const { issueId } = req.params;
    const token = req.query.t;
    const issue = await authorizeStudentToken(issueId, token);

    const message = await createChatMessage({
      issue,
      senderType: 'student',
      senderCounselorId: null,
      body: req.body?.body
    });

    const payload = {
      id: message._id,
      senderType: message.senderType,
      body: message.body,
      createdAt: message.createdAt
    };

    emitMessageNew(issue._id.toString(), payload);

    res.status(201).json({
      success: true,
      message: payload
    });
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// Counselor: list threads
exports.getCounselorThreads = async (req, res, next) => {
  try {
    const counselorId = req.user.id;

    const issues = await Issue.find({ assignedCounselor: counselorId })
      .select('anonId status category severity createdAt updatedAt')
      .lean();

    if (issues.length === 0) {
      return res.status(200).json({ success: true, threads: [] });
    }

    const issueIds = issues.map((issue) => issue._id);

    const latestMessages = await Message.aggregate([
      { $match: { issueId: { $in: issueIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$issueId',
          lastMessage: { $first: '$body' },
          lastMessageAt: { $first: '$createdAt' }
        }
      }
    ]);

    const latestMessageMap = new Map();
    latestMessages.forEach((entry) => {
      latestMessageMap.set(entry._id.toString(), entry);
    });

    const threads = issues
      .map((issue) => {
        const latest = latestMessageMap.get(issue._id.toString());
        const lastMessage = latest?.lastMessage || null;
        const lastMessageAt = latest?.lastMessageAt || null;

        return {
          issueId: issue._id,
          anonId: issue.anonId,
          status: issue.status,
          category: issue.category,
          severity: issue.severity,
          lastMessage,
          lastMessageAt,
          createdAt: issue.createdAt,
          updatedAt: issue.updatedAt
        };
      })
      .sort((a, b) => {
        const aTime = new Date(a.lastMessageAt || a.updatedAt || a.createdAt).getTime();
        const bTime = new Date(b.lastMessageAt || b.updatedAt || b.createdAt).getTime();
        return bTime - aTime;
      });

    res.status(200).json({
      success: true,
      threads
    });
  } catch (error) {
    next(error);
  }
};

// Counselor: fetch messages
exports.getCounselorMessages = async (req, res, next) => {
  try {
    const { issueId } = req.params;
    const counselorId = req.user.id;

    await authorizeCounselorIssue(issueId, counselorId);

    const messages = await Message.find({ issueId }).sort({ createdAt: 1 }).lean();

    const safeMessages = messages.map((message) => ({
      id: message._id,
      senderType: message.senderType,
      senderCounselorId: message.senderCounselorId,
      body: message.body,
      createdAt: message.createdAt
    }));

    res.status(200).json({
      success: true,
      messages: safeMessages
    });
  } catch (error) {
    next(error);
  }
};

// Counselor: send message
exports.createCounselorMessage = async (req, res, next) => {
  try {
    const { issueId } = req.params;
    const counselorId = req.user.id;

    const issue = await authorizeCounselorIssue(issueId, counselorId);

    const message = await createChatMessage({
      issue,
      senderType: 'counselor',
      senderCounselorId: counselorId,
      body: req.body?.body
    });

    const payload = {
      id: message._id,
      senderType: message.senderType,
      senderCounselorId: message.senderCounselorId,
      body: message.body,
      createdAt: message.createdAt
    };

    emitMessageNew(issue._id.toString(), payload);

    res.status(201).json({
      success: true,
      message: payload
    });
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};
