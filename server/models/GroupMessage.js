import mongoose from 'mongoose';

const groupMessageSchema = new mongoose.Schema({
    group: { 
        type: String, 
        ref: 'Group', 
        required: true 
    },
    sender: { 
        type: String, 
        ref: 'User', 
        required: true 
    },
    text: { 
        type: String 
    },
    message_type: { 
        type: String, 
        enum: ['text', 'image', 'file', 'voice', 'video', 'system', 'call_notification'], 
        required: true 
    },
    media_url: { 
        type: String, 
        default: '' 
    },
    file_data: {
        original_name: { type: String },
        file_size: { type: Number },
        mime_type: { type: String }
    },
    reply_to: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'GroupMessage' 
    },
    reactions: [{
        user: { type: String, ref: 'User' },
        emoji: { type: String },
        created_at: { type: Date, default: Date.now }
    }],
    mentions: [{ 
        type: String, 
        ref: 'User' 
    }],
    seen_by: [{
        user: { type: String, ref: 'User' },
        seen_at: { type: Date, default: Date.now }
    }],
    delivered_to: [{
        user: { type: String, ref: 'User' },
        delivered_at: { type: Date, default: Date.now }
    }],
    edited: { 
        type: Boolean, 
        default: false 
    },
    edited_at: { 
        type: Date 
    },
    deleted: { 
        type: Boolean, 
        default: false 
    },
    deleted_at: { 
        type: Date 
    },
    deleted_for: [{ 
        type: String, 
        ref: 'User' 
    }],
    // For system messages
    system_data: {
        action: { type: String }, // 'member_joined', 'member_left', 'member_added', 'member_removed', 'role_changed', etc.
        target_user: { type: String, ref: 'User' },
        performed_by: { type: String, ref: 'User' },
        additional_data: { type: mongoose.Schema.Types.Mixed }
    },
    // For call notifications
    call_data: {
        call_id: { type: String },
        call_type: { type: String, enum: ['voice', 'video'] },
        duration: { type: Number }, // in seconds
        participants: [{ type: String, ref: 'User' }],
        status: { type: String, enum: ['missed', 'completed', 'declined'] }
    }
}, { 
    timestamps: true, 
    minimize: false 
});

// Indexes for better query performance
groupMessageSchema.index({ group: 1, createdAt: -1 });
groupMessageSchema.index({ sender: 1, createdAt: -1 });
groupMessageSchema.index({ group: 1, message_type: 1, createdAt: -1 });
groupMessageSchema.index({ 'seen_by.user': 1 });

// Methods
groupMessageSchema.methods.markAsSeenBy = function(userId) {
    const alreadySeen = this.seen_by.some(seen => seen.user.toString() === userId);
    if (!alreadySeen) {
        this.seen_by.push({
            user: userId,
            seen_at: new Date()
        });
    }
};

groupMessageSchema.methods.addReaction = function(userId, emoji) {
    // Remove existing reaction from same user with same emoji
    this.reactions = this.reactions.filter(
        reaction => !(reaction.user.toString() === userId && reaction.emoji === emoji)
    );
    
    this.reactions.push({
        user: userId,
        emoji: emoji,
        created_at: new Date()
    });
};

groupMessageSchema.methods.removeReaction = function(userId, emoji) {
    this.reactions = this.reactions.filter(
        reaction => !(reaction.user.toString() === userId && reaction.emoji === emoji)
    );
};

const GroupMessage = mongoose.model('GroupMessage', groupMessageSchema);

export default GroupMessage;
