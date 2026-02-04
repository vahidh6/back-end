const express = require('express');
const router = express.Router();
const { 
    register, 
    login, 
    getProfile, 
    updateProfile, 
    changePassword 
} = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth');

// مسیرهای عمومی
router.post('/register', register);        // ثبت‌نام دوکاندار
router.post('/login', login);              // ورود

// مسیرهای محافظت شده
router.get('/profile', authMiddleware, getProfile);            // مشاهده پروفایل
router.put('/profile', authMiddleware, updateProfile);         // به‌روزرسانی پروفایل
router.put('/change-password', authMiddleware, changePassword); // تغییر رمز عبور

module.exports = router;