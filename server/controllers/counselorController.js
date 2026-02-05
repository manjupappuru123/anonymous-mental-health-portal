const Counselor = require('../models/Counselor');
const Issue = require('../models/Issue');

// Get all counselors
exports.getAllCounselors = async (req, res, next) => {
  try {
    const counselors = await Counselor.find({ isActive: true }).select('-password');

    res.status(200).json({
      success: true,
      count: counselors.length,
      counselors
    });
  } catch (error) {
    next(error);
  }
};

// Get counselor by ID
exports.getCounselorById = async (req, res, next) => {
  try {
    const { counselorId } = req.params;

    const counselor = await Counselor.findById(counselorId).select('-password');
    if (!counselor) {
      return res.status(404).json({ success: false, message: 'Counselor not found' });
    }

    res.status(200).json({
      success: true,
      counselor
    });
  } catch (error) {
    next(error);
  }
};

// Get counselor's assigned issues
exports.getCounselorIssues = async (req, res, next) => {
  try {
    const { counselorId } = req.params;
    const { status } = req.query;

    let filter = { assignedCounselor: counselorId };
    if (status) filter.status = status;

    const issues = await Issue.find(filter);

    res.status(200).json({
      success: true,
      count: issues.length,
      issues
    });
  } catch (error) {
    next(error);
  }
};

// Update counselor profile
exports.updateCounselorProfile = async (req, res, next) => {
  try {
    const { counselorId } = req.params;
    const { name, specialization } = req.body;

    let counselor = await Counselor.findById(counselorId);
    if (!counselor) {
      return res.status(404).json({ success: false, message: 'Counselor not found' });
    }

    if (name) counselor.name = name;
    if (specialization) counselor.specialization = specialization;

    counselor = await counselor.save();

    res.status(200).json({
      success: true,
      counselor
    });
  } catch (error) {
    next(error);
  }
};

// Get counselor statistics
exports.getCounselorStats = async (req, res, next) => {
  try {
    const { counselorId } = req.params;

    const counselor = await Counselor.findById(counselorId);
    if (!counselor) {
      return res.status(404).json({ success: false, message: 'Counselor not found' });
    }

    const resolvedIssues = await Issue.countDocuments({
      assignedCounselor: counselorId,
      status: 'Resolved'
    });

    const pendingIssues = await Issue.countDocuments({
      assignedCounselor: counselorId,
      status: { $ne: 'Resolved' }
    });

    res.status(200).json({
      success: true,
      stats: {
        resolvedIssues,
        pendingIssues,
        totalHandled: counselor.totalIssuesHandled
      }
    });
  } catch (error) {
    next(error);
  }
};
