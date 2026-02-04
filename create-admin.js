const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createAdmin() {
  try {
    // اتصال به دیتابیس
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mobile_management');
    
    const User = require('./src/models/User');
    
    // بررسی وجود ادمین
    const existingAdmin = await User.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      console.log('✅ ادمین از قبل وجود دارد');
      console.log('👤 نام کاربری: admin');
      process.exit(0);
    }
    
    // هش کردن رمز عبور
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    // ایجاد ادمین جدید
    const admin = new User({
      fullName: 'مدیر سیستم',
      phone: '09000000000',
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      status: 'active'
    });
    
    await admin.save();
    
    console.log('✅ ادمین با موفقیت ایجاد شد');
    console.log('👤 نام کاربری: admin');
    console.log('🔑 رمز عبور: admin123');
    console.log('⚠️ لطفاً پس از ورود، رمز عبور را تغییر دهید');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ خطا در ایجاد ادمین:', error);
    process.exit(1);
  }
}

createAdmin();