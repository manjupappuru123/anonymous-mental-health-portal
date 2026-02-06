const crypto = require('crypto');

const getStudentTokenSecret = () => {
  const secret = process.env.STUDENT_CHAT_TOKEN_SECRET;
  if (!secret) {
    const error = new Error('Student chat token secret is not configured');
    error.status = 500;
    throw error;
  }
  return secret;
};

const generateStudentToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const hashStudentToken = (token) => {
  const secret = getStudentTokenSecret();
  return crypto.createHmac('sha256', secret).update(token).digest('hex');
};

module.exports = {
  generateStudentToken,
  hashStudentToken
};
