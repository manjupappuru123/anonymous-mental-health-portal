const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mental-health-portal';
    // Prefer IPv4 (family:4) to avoid some DNS/IPv6 routing issues in certain environments
    const options = { family: 4 };
    const conn = await mongoose.connect(uri, options);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    console.error('If using MongoDB Atlas, ensure your current IP is added to Network Access (IP whitelist) and your connection string is correct.');
    process.exit(1);
  }
};

module.exports = connectDB;
