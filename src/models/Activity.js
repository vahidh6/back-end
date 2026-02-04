const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            'login', 'logout', 'register', 
            'create_purchase', 'update_purchase', 'delete_purchase',
            'create_user', 'update_user', 'deactivate_user', 'activate_user',
            'upload_file', 'download_report'
        ]
    },
    entityType: {
        type: String,
        enum: ['user', 'purchase', 'file', 'system']
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId
    },
    description: {
        type: String,
        trim: true
    },
    ipAddress: {
        type: String,
        trim: true
    },
    userAgent: {
        type: String,
        trim: true
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// ایندکس‌گذاری
activitySchema.index({ user: 1 });
activitySchema.index({ action: 1 });
activitySchema.index({ createdAt: -1 });

const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;