const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    // استفاده از MONGO_URI از محیط، اگر تعریف نشده از مقدار ثابت استفاده می‌کنیم
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://shop-etahadiah:Wahid12345%40%40@cluster0.peaufzv.mongodb.net/mobile-management?retryWrites=true&w=majority';
    
    console.log('🔌 در حال اتصال به MongoDB...');
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });

    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error; // حتماً خطا پرتاب شود تا Vercel function crash را درست هندل کند
  }
};

module.exports = connectDB;
