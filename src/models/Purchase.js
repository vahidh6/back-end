const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
    // اطلاعات موبایل
    imei1: {
        type: String,
        required: [true, 'IMEI1 ضروری است'],
        unique: true,
        trim: true,
        uppercase: true,
        match: [/^[0-9]{15}$/, 'IMEI باید ۱۵ رقم باشد']
    },
    imei2: {
        type: String,
        trim: true,
        uppercase: true,
        match: [/^[0-9]{15}$/, 'IMEI باید ۱۵ رقم باشد']
    },
    brand: {
        type: String,
        required: [true, 'برند موبایل ضروری است'],
        trim: true
    },
    model: {
        type: String,
        trim: true
    },
    color: {
        type: String,
        trim: true
    },
    storage: {
        type: String,
        trim: true
    },
    condition: {
        type: String,
        enum: ['new', 'used', 'refurbished'],
        default: 'used'
    },
    price: {
        type: Number,
        required: [true, 'قیمت خرید ضروری است'],
        min: [0, 'قیمت نمی‌تواند منفی باشد']
    },
    
    // اطلاعات فروشنده
    sellerName: {
        type: String,
        required: [true, 'نام فروشنده ضروری است'],
        trim: true
    },
    sellerFatherName: {
        type: String,
        required: [true, 'نام پدر فروشنده ضروری است'],
        trim: true
    },
    sellerPhone: {
        type: String,
        required: [true, 'شماره تماس فروشنده ضروری است'],
        trim: true
    },
    sellerAddress: {
        type: String,
        trim: true
    },
    
    // عکس‌های فروشنده
    sellerPhoto: {
        type: String // آدرس عکس فروشنده
    },
    idCardPhoto: {
        type: String // آدرس عکس تذکره
    },
    thumbPhoto: {
        type: String // آدرس عکس نشان شست
    },
    
    // اطلاعات ثبت
    registeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    shopId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // وضعیت و اطلاعات اضافی
    status: {
        type: String,
        enum: ['active', 'sold', 'returned', 'blocked'],
        default: 'active'
    },
    notes: {
        type: String,
        trim: true
    },
    
    // تاریخ‌ها
    purchaseDate: {
        type: Date,
        default: Date.now
    },
    soldDate: {
        type: Date
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ایندکس‌گذاری برای جستجوی سریع
purchaseSchema.index({ imei1: 1 });
purchaseSchema.index({ imei2: 1 });
purchaseSchema.index({ brand: 1 });
purchaseSchema.index({ registeredBy: 1 });
purchaseSchema.index({ purchaseDate: -1 });
purchaseSchema.index({ status: 1 });

// رابطه مجازی با دوکاندار
purchaseSchema.virtual('shop', {
    ref: 'User',
    localField: 'shopId',
    foreignField: '_id',
    justOne: true
});

// رابطه مجازی با ثبت‌کننده
purchaseSchema.virtual('registrar', {
    ref: 'User',
    localField: 'registeredBy',
    foreignField: '_id',
    justOne: true
});

const Purchase = mongoose.model('Purchase', purchaseSchema);

module.exports = Purchase;