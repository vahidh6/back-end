// src/config/database.js
const mongoose = require('mongoose');
require('dotenv').config();
const mongoURI = 'mongodb+srv://shop-etahadiah:Wahid12345%40%40@cluster0.peaufzv.mongodb.net/mobile-management?retryWrites=true&w=majority';

const connectDB = async () => {
  try {
    console.log('🔌 در حال اتصال به MongoDB...');

    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) throw new Error('MONGO_URI در فایل .env تعریف نشده است!');

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // کاهش زمان انتظار
    });

    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('⚠️ در حال استفاده از حالت تست (بدون دیتابیس)...');
  }
};

module.exports = connectDB;
