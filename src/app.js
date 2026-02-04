// src/app.js

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// اتصال به دیتابیس
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth.routes');
const purchaseRoutes = require('./routes/purchase.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// میدلورهای امنیتی
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));

// پردازش JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// مسیرهای استاتیک
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// مسیرهای API
app.use('/api/auth', authRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/admin', adminRoutes);

// Route سلامت سیستم
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Mobile Purchase Management System'
    });
});

// Route اصلی
app.get('/', (req, res) => {
    res.json({
        message: 'خوش آمدید به سیستم مدیریت خرید موبایل',
        endpoints: {
            auth: '/api/auth',
            purchases: '/api/purchases',
            admin: '/api/admin',
            health: '/api/health'
        }
    });
});

// صفحه 404
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'مسیر یافت نشد'
    });
});

// راه‌اندازی سرور - این خط را اضافه کنید
const PORT = process.env.PORT || 5000;


connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`
        🚀 سرور در حال اجرا است:
        📍 پورت: ${PORT}
        🌐 آدرس: http://localhost:${PORT}
        📊 وضعیت: http://localhost:${PORT}/api/health
        🗄️ محیط: ${process.env.NODE_ENV || 'development'}
        `);
    });
}).catch(err => {
    console.error('❌ خطا در راه‌اندازی سرور:', err);
});