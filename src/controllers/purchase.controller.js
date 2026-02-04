const Purchase = require('../models/Purchase');
const User = require('../models/User');
const Activity = require('../models/Activity');

// ثبت خرید جدید
exports.createPurchase = async (req, res) => {
    try {
        const {
            imei1, imei2, brand, model, color, storage, condition, price,
            sellerName, sellerFatherName, sellerPhone, sellerAddress,
            notes
        } = req.body;

        // بررسی وجود IMEI
        const existingPurchase = await Purchase.findOne({ imei1 });
        if (existingPurchase) {
            return res.status(400).json({
                success: false,
                message: 'این IMEI قبلاً ثبت شده است'
            });
        }

        // آدرس فایل‌های آپلود شده
        const sellerPhoto = req.files?.sellerPhoto?.[0]?.path;
        const idCardPhoto = req.files?.idCardPhoto?.[0]?.path;
        const thumbPhoto = req.files?.thumbPhoto?.[0]?.path;

        // ایجاد خرید جدید
        const purchase = new Purchase({
            imei1,
            imei2,
            brand,
            model,
            color,
            storage,
            condition,
            price,
            sellerName,
            sellerFatherName,
            sellerPhone,
            sellerAddress,
            sellerPhoto,
            idCardPhoto,
            thumbPhoto,
            notes,
            registeredBy: req.user._id,
            shopId: req.user._id,
            purchaseDate: new Date()
        });

        await purchase.save();

        // ثبت فعالیت
        await Activity.create({
            user: req.user._id,
            action: 'create_purchase',
            entityType: 'purchase',
            entityId: purchase._id,
            description: `ثبت خرید موبایل ${brand} با IMEI: ${imei1}`,
            ipAddress: req.ip,
            metadata: {
                brand,
                imei1,
                price
            }
        });

        res.status(201).json({
            success: true,
            message: 'خرید با موفقیت ثبت شد',
            data: purchase
        });

    } catch (error) {
        console.error('خطا در ثبت خرید:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در ثبت خرید'
        });
    }
};

// مشاهده لیست خریدهای دوکاندار
exports.getMyPurchases = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, brand, status, startDate, endDate } = req.query;
        
        // ایجاد فیلتر
        const filter = { shopId: req.user._id };
        
        if (search) {
            filter.$or = [
                { imei1: { $regex: search, $options: 'i' } },
                { imei2: { $regex: search, $options: 'i' } },
                { sellerName: { $regex: search, $options: 'i' } },
                { sellerPhone: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (brand) {
            filter.brand = { $regex: brand, $options: 'i' };
        }
        
        if (status) {
            filter.status = status;
        }
        
        if (startDate || endDate) {
            filter.purchaseDate = {};
            if (startDate) filter.purchaseDate.$gte = new Date(startDate);
            if (endDate) filter.purchaseDate.$lte = new Date(endDate);
        }

        // اجرای کوئری
        const purchases = await Purchase.find(filter)
            .sort({ purchaseDate: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('registrar', 'fullName phone');

        const total = await Purchase.countDocuments(filter);

        res.json({
            success: true,
            data: purchases,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('خطا در دریافت لیست خریدها:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در دریافت لیست خریدها'
        });
    }
};

// مشاهده جزئیات یک خرید
exports.getPurchaseById = async (req, res) => {
    try {
        const purchase = await Purchase.findById(req.params.id)
            .populate('registrar', 'fullName phone')
            .populate('shop', 'fullName shopName shopAddress phone');

        if (!purchase) {
            return res.status(404).json({
                success: false,
                message: 'خرید مورد نظر یافت نشد'
            });
        }

        res.json({
            success: true,
            data: purchase
        });

    } catch (error) {
        console.error('خطا در دریافت جزئیات خرید:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در دریافت جزئیات خرید'
        });
    }
};

// به‌روزرسانی خرید
exports.updatePurchase = async (req, res) => {
    try {
        const updates = req.body;
        
        // حذف فیلدهای غیرقابل تغییر
        delete updates.imei1;
        delete updates.registeredBy;
        delete updates.shopId;
        delete updates.purchaseDate;

        // آدرس فایل‌های جدید
        if (req.files?.sellerPhoto) {
            updates.sellerPhoto = req.files.sellerPhoto[0].path;
        }
        if (req.files?.idCardPhoto) {
            updates.idCardPhoto = req.files.idCardPhoto[0].path;
        }
        if (req.files?.thumbPhoto) {
            updates.thumbPhoto = req.files.thumbPhoto[0].path;
        }

        const purchase = await Purchase.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );

        if (!purchase) {
            return res.status(404).json({
                success: false,
                message: 'خرید مورد نظر یافت نشد'
            });
        }

        // ثبت فعالیت
        await Activity.create({
            user: req.user._id,
            action: 'update_purchase',
            entityType: 'purchase',
            entityId: purchase._id,
            description: 'به‌روزرسانی اطلاعات خرید',
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: 'خرید با موفقیت به‌روزرسانی شد',
            data: purchase
        });

    } catch (error) {
        console.error('خطا در به‌روزرسانی خرید:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در به‌روزرسانی خرید'
        });
    }
};

// حذف خرید
exports.deletePurchase = async (req, res) => {
    try {
        const purchase = await Purchase.findByIdAndDelete(req.params.id);

        if (!purchase) {
            return res.status(404).json({
                success: false,
                message: 'خرید مورد نظر یافت نشد'
            });
        }

        // ثبت فعالیت
        await Activity.create({
            user: req.user._id,
            action: 'delete_purchase',
            entityType: 'purchase',
            entityId: req.params.id,
            description: 'حذف خرید',
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: 'خرید با موفقیت حذف شد'
        });

    } catch (error) {
        console.error('خطا در حذف خرید:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در حذف خرید'
        });
    }
};

// گزارش‌گیری
exports.getPurchasesReport = async (req, res) => {
    try {
        const { startDate, endDate, groupBy = 'brand' } = req.query;
        
        const match = { shopId: req.user._id };
        
        if (startDate || endDate) {
            match.purchaseDate = {};
            if (startDate) match.purchaseDate.$gte = new Date(startDate);
            if (endDate) match.purchaseDate.$lte = new Date(endDate);
        }

        const report = await Purchase.aggregate([
            { $match: match },
            {
                $group: {
                    _id: `$${groupBy}`,
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$price' },
                    avgPrice: { $avg: '$price' }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // آمار کلی
        const stats = await Purchase.aggregate([
            { $match: match },
            {
                $group: {
                    _id: null,
                    totalPurchases: { $sum: 1 },
                    totalValue: { $sum: '$price' },
                    avgPurchaseValue: { $avg: '$price' }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                report,
                stats: stats[0] || {}
            }
        });

    } catch (error) {
        console.error('خطا در دریافت گزارش:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در دریافت گزارش'
        });
    }
};