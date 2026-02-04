const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: [true, 'نام کامل ضروری است'], trim: true },
    phone: { type: String, required: [true, 'شماره تماس ضروری است'], unique: true, trim: true, match: [/^[0-9]{10,15}$/, 'لطفاً شماره تماس معتبر وارد کنید'] },
    shopName: { type: String, trim: true },
    shopAddress: { type: String, trim: true },
    shopPhoto: { type: String, trim: true },
    username: { type: String, required: [true, 'نام کاربری ضروری است'], unique: true, trim: true, lowercase: true },
    password: { type: String, required: [true, 'رمز عبور ضروری است'], minlength: [6, 'رمز عبور باید حداقل ۶ کاراکتر باشد'], select: false },
    role: { type: String, enum: ['admin', 'shopOwner'], default: 'shopOwner' },
    status: { type: String, enum: ['active', 'inactive', 'pending'], default: 'pending' },
    sellerPhoto: { type: String },
    idCardPhoto: { type: String },
    thumbPhoto: { type: String },
    lastLogin: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// 🔐 هش کردن رمز فقط اگر قبلاً هش نشده باشد
userSchema.pre('save', async function(next) {
    if (!this.isModified('password') || !this.password) return next();

    const isHashed = this.password.startsWith('$2a$') || this.password.startsWith('$2b$');
    if (isHashed) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// متد مقایسه رمز عبور
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// حذف فیلدهای حساس
userSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.password;
    delete user.__v;
    return user;
};

// رابطه مجازی با خریدها
userSchema.virtual('purchases', {
    ref: 'Purchase',
    localField: '_id',
    foreignField: 'registeredBy'
});

const User = mongoose.model('User', userSchema);

module.exports = User;
