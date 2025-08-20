import mongoose from 'mongoose';

const groupPostSchema = new mongoose.Schema({
    group: { 
        type: String, 
        ref: 'Group', 
        required: true 
    },
    user: { 
        type: String, 
        ref: 'User', 
        required: true 
    },
    content: { 
        type: String 
    },
    image_urls: [{ 
        type: String 
    }],
    post_type: { 
        type: String, 
        enum: ['text', 'image', 'text_with_image', 'poll', 'event', 'announcement'], 
        required: true 
    },
    likes_count: [{ 
        type: String, 
        ref: 'User' 
    }],
    comments_count: { 
        type: Number, 
        default: 0 
    },
    shares_count: { 
        type: Number, 
        default: 0 
    },
    is_pinned: { 
        type: Boolean, 
        default: false 
    },
    is_announcement: { 
        type: Boolean, 
        default: false 
    },
    approval_status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected'], 
        default: 'approved' 
    },
    approved_by: { 
        type: String, 
        ref: 'User' 
    },
    approved_at: { 
        type: Date 
    },
    // For polls
    poll_data: {
        question: { type: String },
        options: [{
            option_text: { type: String },
            votes: [{ type: String, ref: 'User' }]
        }],
        multiple_choice: { type: Boolean, default: false },
        expires_at: { type: Date }
    },
    // For events
    event_data: {
        title: { type: String },
        start_date: { type: Date },
        end_date: { type: Date },
        location: { type: String },
        virtual_link: { type: String },
        attendees: [{ 
            user: { type: String, ref: 'User' },
            status: { type: String, enum: ['going', 'maybe', 'not_going'], default: 'going' }
        }]
    },
    visibility: { 
        type: String, 
        enum: ['all_members', 'admins_only', 'moderators_only'], 
        default: 'all_members' 
    },
    archived: { 
        type: Boolean, 
        default: false 
    }
}, { 
    timestamps: true, 
    minimize: false 
});

// Indexes for better query performance
groupPostSchema.index({ group: 1, createdAt: -1 });
groupPostSchema.index({ user: 1, createdAt: -1 });
groupPostSchema.index({ group: 1, is_pinned: -1, createdAt: -1 });
groupPostSchema.index({ group: 1, approval_status: 1 });

const GroupPost = mongoose.model('GroupPost', groupPostSchema);

export default GroupPost;
