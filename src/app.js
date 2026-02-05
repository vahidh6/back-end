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

/* ================== Middlewares ================== */
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================== Static files ================== */
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

/* ================== Routes ================== */
app.use('/api/auth', authRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/admin', adminRoutes);

/* ================== Health check ================== */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Mobile Purchase Management System'
  });
});

/* ================== Root ================== */
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

/* ================== 404 ================== */
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'مسیر یافت نشد'
  });
});

/* ================== Start Server ================== */
const PORT = process.env.PORT || 5000;

// 🔥 اول سرور بالا می‌آید (خیلی مهم برای Render)
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// 🔗 اتصال دیتابیس جداگانه
connectDB()
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));
