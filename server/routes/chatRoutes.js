const express = require('express');
const router = express.Router();
const {
  getStudentThread,
  getStudentMessages,
  createStudentMessage,
  getCounselorThreads,
  getCounselorMessages,
  createCounselorMessage
} = require('../controllers/chatController');
const { authenticate } = require('../middleware/authMiddleware');

// Student (token-based)
router.get('/student/:issueId', getStudentThread);
router.get('/student/:issueId/messages', getStudentMessages);
router.post('/student/:issueId/messages', createStudentMessage);

// Counselor (JWT-based)
router.get('/counselor/threads', authenticate, getCounselorThreads);
router.get('/counselor/:issueId/messages', authenticate, getCounselorMessages);
router.post('/counselor/:issueId/messages', authenticate, createCounselorMessage);

module.exports = router;
