// src/controllers/auth.controller.js - نسخه کاملاً جدید و تست شده
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// ثبت‌نام دوکاندار
exports.register = async (req, res) => {
    try {
        console.log('📝 درخواست ثبت‌نام:', req.body);
        
        const { fullName, phone, shopName, shopAddress, username, password } = req.body;

        // بررسی وجود کاربر
        const existingUser = await User.findOne({ 
            $or: [{ phone }, { username }] 
        });
        
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'شماره تماس یا نام کاربری قبلاً ثبت شده است'
            });
        }

        // ایجاد کاربر جدید
        const user = new User({
            fullName,
            phone,
            shopName,
            shopAddress,
            username,
            password,
            role: 'shopOwner',
            status: 'pending'
        });

        await user.save();

        res.status(201).json({
            success: true,
            message: 'ثبت‌نام موفقیت‌آمیز. منتظر تأیید ادمین باشید.',
            data: {
                id: user._id,
                username: user.username,
                fullName: user.fullName,
                phone: user.phone,
                status: user.status,
                role: user.role
            }
        });

    } catch (error) {
        console.error('❌ خطا در ثبت‌نام:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در ثبت‌نام کاربر'
        });
    }
};

// ورود کاربر - نسخه کاملاً تست شده
exports.login = async (req, res) => {
    try {
        console.log('🔐 درخواست ورود:', req.body);
        
        const { username, password } = req.body;

        // اعتبارسنجی ورودی
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'نام کاربری و رمز عبور الزامی هستند'
            });
        }

        // پیدا کردن کاربر
        console.log(`🔍 جستجوی کاربر: ${username}`);
        const user = await User.findOne({ username: username.trim() }).select('+password');
        
        if (!user) {
            console.log(`❌ کاربر "${username}" یافت نشد`);
            return res.status(401).json({
                success: false,
                message: 'نام کاربری یا رمز عبور اشتباه است'
            });
        }

        console.log(`✅ کاربر یافت شد: ${user.username}`);
        console.log(`🔐 وضعیت: ${user.status}, نقش: ${user.role}`);

        // بررسی رمز عبور با bcrypt مستقیماً
        console.log('🔍 بررسی رمز عبور...');
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        console.log(`🔐 تطابق رمز: ${isPasswordValid}`);
        
        if (!isPasswordValid) {
            console.log(`❌ رمز اشتباه برای کاربر ${username}`);
            return res.status(401).json({
                success: false,
                message: 'نام کاربری یا رمز عبور اشتباه است'
            });
        }

        // بررسی وضعیت کاربر
        if (user.status !== 'active') {
            console.log(`⚠️ کاربر ${username} غیرفعال است. وضعیت: ${user.status}`);
            return res.status(403).json({
                success: false,
                message: 'حساب کاربری شما غیرفعال است. لطفاً با ادمین تماس بگیرید.'
            });
        }

        // بررسی JWT_SECRET
        if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('your_super_secret')) {
            console.log('⚠️ JWT_SECRET پیش‌فرض است!');
            return res.status(500).json({
                success: false,
                message: 'خطا در پیکربندی سرور'
            });
        }

        // ایجاد توکن JWT
        console.log('🔑 ایجاد توکن JWT...');
        const token = jwt.sign(
            { 
                userId: user._id.toString(), 
                role: user.role,
                username: user.username
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '24h' }
        );

        console.log(`✅ توکن ایجاد شد (${token.length} کاراکتر)`);

        // به‌روزرسانی آخرین ورود
        user.lastLogin = new Date();
        await user.save();

        // پاسخ موفق
        const userResponse = {
            id: user._id,
            username: user.username,
            fullName: user.fullName,
            phone: user.phone,
            role: user.role,
            status: user.status,
            shopName: user.shopName,
            shopAddress: user.shopAddress
        };

        console.log(`🎉 ورود موفق برای ${user.username}`);
        
        res.json({
            success: true,
            message: 'ورود موفقیت‌آمیز',
            token,
            user: userResponse
        });

    } catch (error) {
        console.error('❌ خطا در ورود:', error);
        console.error(error.stack);
        
        res.status(500).json({
            success: false,
            message: 'خطا در ورود به سیستم'
        });
    }
};

// مشاهده پروفایل
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        res.json({
            success: true,
            data: user
        });

    } catch (error) {
        console.error('خطا در دریافت پروفایل:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در دریافت پروفایل'
        });
    }
};

// به‌روزرسانی پروفایل
exports.updateProfile = async (req, res) => {
    try {
        const updates = req.body;
        
        delete updates.role;
        delete updates.status;
        delete updates.password;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'پروفایل با موفقیت به‌روزرسانی شد',
            data: user
        });

    } catch (error) {
        console.error('خطا در به‌روزرسانی پروفایل:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در به‌روزرسانی پروفایل'
        });
    }
};

// تغییر رمز عبور
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id).select('+password');

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'رمز عبور فعلی اشتباه است'
            });
        }

        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'رمز عبور با موفقیت تغییر کرد'
        });

    } catch (error) {
        console.error('خطا در تغییر رمز عبور:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در تغییر رمز عبور'
        });
    }
};