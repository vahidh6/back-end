const express = require('express');
const router = express.Router();
const {
    createPurchase,
    getMyPurchases,
    getPurchaseById,
    updatePurchase,
    deletePurchase,
    getPurchasesReport
} = require('../controllers/purchase.controller');
const { authMiddleware, requireOwnership } = require('../middleware/auth');
const { uploadFields, handleUploadError } = require('../middleware/upload');

// میدلور آپلود فایل‌ها
const uploadPurchaseFiles = uploadFields([
    { name: 'sellerPhoto', maxCount: 1 },
    { name: 'idCardPhoto', maxCount: 1 },
    { name: 'thumbPhoto', maxCount: 1 }
]);

// همه routeها نیاز به احراز هویت دارند
router.use(authMiddleware);

// ایجاد خرید جدید
router.post('/', uploadPurchaseFiles, handleUploadError, createPurchase);

// مشاهده خریدهای دوکاندار
router.get('/my-purchases', getMyPurchases);

// گزارش‌گیری
router.get('/report', getPurchasesReport);

// مشاهده، به‌روزرسانی و حذف خرید (نیاز به مالکیت)
router.get('/:id', requireOwnership('Purchase'), getPurchaseById);
router.put('/:id', requireOwnership('Purchase'), uploadPurchaseFiles, handleUploadError, updatePurchase);
router.delete('/:id', requireOwnership('Purchase'), deletePurchase);

module.exports = router;