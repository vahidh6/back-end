const mongoose = require('mongoose');
const User = require('../models/User'); 
require('dotenv').config();
const connectDB = require('../config/database'); 

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Admin@123';

const createOrUpdateAdmin = async () => {
  try {
    await connectDB();

    let admin = await User.findOne({ username: ADMIN_USERNAME }).select('+password');

    if (admin) {
      console.log('⚠️ ادمین قبلاً ساخته شده، اصلاح status و رمز...');
      admin.password = ADMIN_PASSWORD; // بدون هش، مدل خودش هش می‌کند
      admin.status = 'active';
      await admin.save();
      console.log('✅ ادمین اصلاح شد');
    } else {
      admin = new User({
        fullName: 'Super Admin',
        phone: '0700000000',
        username: ADMIN_USERNAME,
        password: ADMIN_PASSWORD, // بدون هش
        role: 'admin',
        status: 'active'
      });
      await admin.save();
      console.log('✅ ادمین ساخته شد');
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ خطا در ساخت ادمین:', error.message);
    process.exit(1);
  }
};

createOrUpdateAdmin();
