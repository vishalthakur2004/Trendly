import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    recipient: { 
        type: String, 
        ref: 'User', 
        required: true 
    },
    sender: { 
        type: String, 
        ref: 'User', 
        required: true 
    },
    type: { 
        type: String, 
        enum: [
            'like', 
            'comment', 
            'reply', 
            'follow', 
            'message', 
            'share',
            'comment_like',
            'mention'
        ], 
        required: true 
    },
    content: { 
        type: String, 
        required: true 
    },
    is_read: { 
        type: Boolean, 
        default: false 
    },
    related_post: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Post', 
        default: null 
    },
    related_comment: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Comment', 
        default: null 
    },
    related_message: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Message', 
        default: null 
    },
    action_url: { 
        type: String, 
        default: null 
    },
    metadata: {
        type: Object,
        default: {}
    }
}, { 
    timestamps: true, 
    minimize: false 
});

// Index for better query performance
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, is_read: 1 });
notificationSchema.index({ sender: 1, type: 1, related_post: 1 }); // For preventing duplicate notifications

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
