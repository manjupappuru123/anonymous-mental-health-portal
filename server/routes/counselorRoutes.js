const express = require('express');
const router = express.Router();
const {
  getAllCounselors,
  getCounselorById,
  getCounselorIssues,
  updateCounselorProfile,
  getCounselorStats
} = require('../controllers/counselorController');
const { authenticate } = require('../middleware/authMiddleware');

router.get('/', getAllCounselors);
router.get('/:counselorId', getCounselorById);
router.get('/:counselorId/issues', authenticate, getCounselorIssues);
router.put('/:counselorId/profile', authenticate, updateCounselorProfile);
router.get('/:counselorId/stats', authenticate, getCounselorStats);

module.exports = router;
