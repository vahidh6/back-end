const User = require('../models/User');
const Purchase = require('../models/Purchase');
const Activity = require('../models/Activity');

// لیست تمام دوکانداران
exports.getAllShops = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, status } = req.query;
        
        const filter = { role: 'shopOwner' };
        
        if (search) {
            filter.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { shopName: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (status) {
            filter.status = status;
        }

        const shops = await User.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('approvedBy', 'fullName');

        const total = await User.countDocuments(filter);

        res.json({
            success: true,
            data: shops,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('خطا در دریافت لیست دوکانداران:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در دریافت لیست دوکانداران'
        });
    }
};

// تأیید دوکاندار
exports.approveShop = async (req, res) => {
    try {
        const { id } = req.params;
        const shop = await User.findById(id);

        if (!shop || shop.role !== 'shopOwner') {
            return res.status(404).json({
                success: false,
                message: 'دوکاندار مورد نظر یافت نشد'
            });
        }

        shop.status = 'active';
        shop.approvedBy = req.user._id;
        shop.approvedAt = new Date();
        
        await shop.save();

        // ثبت فعالیت
        await Activity.create({
            user: req.user._id,
            action: 'activate_user',
            entityType: 'user',
            entityId: shop._id,
            description: `تأیید دوکاندار: ${shop.fullName}`,
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: 'دوکاندار با موفقیت تأیید شد',
            data: shop.toJSON()
        });

    } catch (error) {
        console.error('خطا در تأیید دوکاندار:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در تأیید دوکاندار'
        });
    }
};

// غیرفعال کردن دوکاندار
exports.deactivateShop = async (req, res) => {
    try {
        const { id } = req.params;
        const shop = await User.findById(id);

        if (!shop || shop.role !== 'shopOwner') {
            return res.status(404).json({
                success: false,
                message: 'دوکاندار مورد نظر یافت نشد'
            });
        }

        shop.status = 'inactive';
        await shop.save();

        // ثبت فعالیت
        await Activity.create({
            user: req.user._id,
            action: 'deactivate_user',
            entityType: 'user',
            entityId: shop._id,
            description: `غیرفعال کردن دوکاندار: ${shop.fullName}`,
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: 'دوکاندار با موفقیت غیرفعال شد',
            data: shop.toJSON()
        });

    } catch (error) {
        console.error('خطا در غیرفعال کردن دوکاندار:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در غیرفعال کردن دوکاندار'
        });
    }
};

// مشاهده تمام خریدها
exports.getAllPurchases = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            search, 
            brand, 
            status, 
            shopId,
            startDate, 
            endDate 
        } = req.query;
        
        // ایجاد فیلتر
        const filter = {};
        
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
        
        if (shopId) {
            filter.shopId = shopId;
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
            .populate('registrar', 'fullName phone')
            .populate('shop', 'fullName shopName phone');

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
// ایجاد دوکاندار جدید
exports.createShop = async (req, res) => {
    try {
        const { username, password, fullName, shopName, phone, address } = req.body;

        if(!username || !password || !shopName){
            return res.status(400).json({ success:false, message:'فیلدهای ضروری را پر کنید' });
        }

        // بررسی وجود نام کاربری
        const existingUser = await User.findOne({ username });
        if(existingUser){
            return res.status(400).json({ success:false, message:'نام کاربری قبلاً وجود دارد' });
        }

        const newShop = await User.create({
            username,
            password, // ⚠️ در عمل حتما hash شود
            role: 'shopOwner',
            fullName,
            shopName,
            phone,
            address,
            status: 'pending'
        });

        res.status(201).json({ success:true, message:'دوکاندار ثبت شد', data:newShop });

    } catch (err) {
        console.error('خطا در ثبت دوکاندار:', err);
        res.status(500).json({ success:false, message:'خطا در ثبت دوکاندار' });
    }
};

// آمار کلی سیستم
exports.getSystemStats = async (req, res) => {
    try {
        // آمار کاربران
        const userStats = await User.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // آمار خریدها
        const purchaseStats = await Purchase.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalValue: { $sum: '$price' }
                }
            }
        ]);

        // آمار بر اساس برند
        const brandStats = await Purchase.aggregate([
            {
                $group: {
                    _id: '$brand',
                    count: { $sum: 1 },
                    totalValue: { $sum: '$price' }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // آمار روزانه
        const dailyStats = await Purchase.aggregate([
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$purchaseDate" }
                    },
                    count: { $sum: 1 },
                    totalValue: { $sum: '$price' }
                }
            },
            { $sort: { _id: -1 } },
            { $limit: 30 }
        ]);

        res.json({
            success: true,
            data: {
                userStats,
                purchaseStats,
                brandStats,
                dailyStats,
                summary: {
                    totalShops: await User.countDocuments({ role: 'shopOwner' }),
                    activeShops: await User.countDocuments({ role: 'shopOwner', status: 'active' }),
                    totalPurchases: await Purchase.countDocuments(),
                    totalPurchaseValue: await Purchase.aggregate([
                        { $group: { _id: null, total: { $sum: '$price' } } }
                    ]).then(result => result[0]?.total || 0)
                }
            }
        });

    } catch (error) {
        console.error('خطا در دریافت آمار سیستم:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در دریافت آمار سیستم'
        });
    }
};

// گزارش‌گیری پیشرفته
exports.getAdvancedReport = async (req, res) => {
    try {
        const { startDate, endDate, groupBy = 'shopId' } = req.query;
        
        const match = {};
        
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
                    purchaseCount: { $sum: 1 },
                    totalAmount: { $sum: '$price' },
                    avgPrice: { $avg: '$price' },
                    brands: { $addToSet: '$brand' }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'shopInfo'
                }
            },
            { $unwind: '$shopInfo' },
            {
                $project: {
                    _id: 0,
                    shopId: '$_id',
                    shopName: '$shopInfo.shopName',
                    ownerName: '$shopInfo.fullName',
                    phone: '$shopInfo.phone',
                    purchaseCount: 1,
                    totalAmount: 1,
                    avgPrice: 1,
                    brandCount: { $size: '$brands' }
                }
            },
            { $sort: { totalAmount: -1 } }
        ]);

        res.json({
            success: true,
            data: report
        });

    } catch (error) {
        console.error('خطا در دریافت گزارش پیشرفته:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در دریافت گزارش پیشرفته'
        });
    }
};

// مشاهده فعالیت‌های سیستم
exports.getActivities = async (req, res) => {
    try {
        const { page = 1, limit = 20, userId, action, startDate, endDate } = req.query;
        
        const filter = {};
        
        if (userId) {
            filter.user = userId;
        }
        
        if (action) {
            filter.action = action;
        }
        
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        const activities = await Activity.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('user', 'fullName role');

        const total = await Activity.countDocuments(filter);

        res.json({
            success: true,
            data: activities,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('خطا در دریافت فعالیت‌ها:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در دریافت فعالیت‌ها'
        });
    }
};