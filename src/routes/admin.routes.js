const express = require('express');
const router = express.Router();
const {
    getAllShops,
    approveShop,
    deactivateShop,
    getAllPurchases,
    getSystemStats,
    getAdvancedReport,
    getActivities
} = require('../controllers/admin.controller');
const { authMiddleware, requireRole } = require('../middleware/auth');

// همه routeها نیاز به نقش ادمین دارند
router.use(authMiddleware, requireRole('admin'));

// مدیریت دوکانداران
router.get('/shops', getAllShops);
router.put('/shops/:id/approve', approveShop);
router.put('/shops/:id/deactivate', deactivateShop);

// مشاهده خریدها
router.get('/purchases', getAllPurchases);

// گزارش‌گیری و آمار
router.get('/stats', getSystemStats);
router.get('/reports/advanced', getAdvancedReport);

// فعالیت‌های سیستم
router.get('/activities', getActivities);

module.exports = router;