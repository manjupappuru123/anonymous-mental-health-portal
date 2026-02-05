const Counselor = require('../models/Counselor');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Register Counselor
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, specialization } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    let counselor = await Counselor.findOne({ email });
    if (counselor) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    counselor = await Counselor.create({
      name,
      email,
      password,
      specialization: specialization || 'General'
    });

    const token = generateToken(counselor._id);

    res.status(201).json({
      success: true,
      token,
      counselor
    });
  } catch (error) {
    next(error);
  }
};

// Login Counselor
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const counselor = await Counselor.findOne({ email });
    if (!counselor) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isPasswordMatch = await counselor.matchPassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(counselor._id);

    res.status(200).json({
      success: true,
      token,
      counselor
    });
  } catch (error) {
    next(error);
  }
};

// Get Current Counselor
exports.getCurrentCounselor = async (req, res, next) => {
  try {
    const counselor = await Counselor.findById(req.user.id);
    res.status(200).json({
      success: true,
      counselor
    });
  } catch (error) {
    next(error);
  }
};
