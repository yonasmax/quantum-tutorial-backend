const app = require('../src/app');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// ================================================================
// CACHE DATABASE CONNECTION (Serverless optimization)
// ================================================================
let cachedConnection = null;

async function connectDB() {
  if (cachedConnection) {
    console.log('✅ Using cached MongoDB connection');
    return cachedConnection;
  }

  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    cachedConnection = connection;
    console.log('✅ MongoDB Connected Successfully');
    return connection;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    throw error;
  }
}

// ================================================================
// VERCEL SERVERLESS HANDLER
// ================================================================
module.exports = async (req, res) => {
  try {
    // Ensure MongoDB is connected
    await connectDB();

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
      return res.status(200).end();
    }

    // Pass request to Express app
    return app(req, res);
  } catch (error) {
    console.error('❌ Serverless handler error:', error.message);
    return res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
};