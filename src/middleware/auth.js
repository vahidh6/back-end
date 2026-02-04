const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    try {
        // دریافت توکن از هدر
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'لطفاً وارد شوید'
            });
        }

        // بررسی اعتبار توکن
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // پیدا کردن کاربر
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'کاربر یافت نشد'
            });
        }

        // بررسی فعال بودن کاربر
        if (user.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'حساب کاربری شما غیرفعال است'
            });
        }

        // ذخیره کاربر در request
        req.user = user;
        req.token = token;
        
        next();
    } catch (error) {
        console.error('خطا در احراز هویت:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'توکن نامعتبر است'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'توکن منقضی شده است'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'خطای سرور در احراز هویت'
        });
    }
};

// میدلور برای نقش‌ها
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'لطفاً وارد شوید'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'شما مجوز دسترسی به این بخش را ندارید'
            });
        }

        next();
    };
};

// میدلور مالکیت (دوکاندار فقط اطلاعات خودش را ببیند)
const requireOwnership = (modelName, idParam = 'id') => {
    return async (req, res, next) => {
        try {
            const Model = require(`../models/${modelName}`);
            const document = await Model.findById(req.params[idParam]);
            
            if (!document) {
                return res.status(404).json({
                    success: false,
                    message: 'مورد یافت نشد'
                });
            }

            // اگر ادمین است، اجازه دسترسی دارد
            if (req.user.role === 'admin') {
                return next();
            }

            // اگر دوکاندار است، فقط اطلاعات خودش را ببیند
            if (modelName === 'Purchase') {
                if (document.shopId.toString() !== req.user._id.toString()) {
                    return res.status(403).json({
                        success: false,
                        message: 'شما فقط می‌توانید اطلاعات دوکان خود را مشاهده کنید'
                    });
                }
            } else if (modelName === 'User') {
                if (document._id.toString() !== req.user._id.toString()) {
                    return res.status(403).json({
                        success: false,
                        message: 'شما فقط می‌توانید اطلاعات خود را مشاهده کنید'
                    });
                }
            }

            next();
        } catch (error) {
            console.error('خطا در بررسی مالکیت:', error);
            res.status(500).json({
                success: false,
                message: 'خطای سرور'
            });
        }
    };
};

module.exports = { authMiddleware, requireRole, requireOwnership };