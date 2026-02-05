// src/config/database.js
const mongoose = require('mongoose');

const mongoURI = 'mongodb+srv://shop-etahadiah:Wahid12345%40%40@cluster0.peaufzv.mongodb.net/mobile-management?retryWrites=true&w=majority';

const connectDB = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    // ⚠️ crash نکن!
  }
};

module.exports = connectDB;
