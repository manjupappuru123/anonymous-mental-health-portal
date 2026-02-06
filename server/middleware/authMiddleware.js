const jwt = require('jsonwebtoken');

const verifyJwtToken = (token) => {
  if (!token) {
    const error = new Error('No token provided');
    error.status = 401;
    throw error;
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  } catch (error) {
    const err = new Error('Invalid token');
    err.status = 401;
    throw err;
  }
};

exports.authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = verifyJwtToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(error.status || 401).json({ success: false, message: error.message });
  }
};

exports.verifyJwtToken = verifyJwtToken;
