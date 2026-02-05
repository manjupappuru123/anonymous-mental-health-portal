const express = require('express');
const router = express.Router();
const {
  submitIssue,
  getIssueByAnonId,
  getAllIssues,
  assignIssue,
  addResponse,
  deleteIssue
} = require('../controllers/issueController');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/submit', submitIssue);
router.get('/:anonId', getIssueByAnonId);
router.get('/', authenticate, getAllIssues);
router.put('/:issueId/assign', authenticate, assignIssue);
router.put('/:issueId/response', authenticate, addResponse);
router.delete('/:issueId', authenticate, deleteIssue);

module.exports = router;
