// server.js
require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/database');

const PORT = process.env.PORT || 5000;

// اتصال به دیتابیس (غیرمسدودکننده)
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