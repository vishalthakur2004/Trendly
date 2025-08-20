import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
    _id: { 
        type: String, 
        required: true 
    },
    name: { 
        type: String, 
        required: true, 
        trim: true,
        maxlength: 100 
    },
    description: { 
        type: String, 
        maxlength: 500,
        default: '' 
    },
    profile_picture: { 
        type: String, 
        default: '' 
    },
    cover_photo: { 
        type: String, 
        default: '' 
    },
    privacy: { 
        type: String, 
        enum: ['public', 'private', 'secret'], 
        default: 'public' 
    },
    category: { 
        type: String, 
        default: 'general' 
    },
    tags: [{ 
        type: String 
    }],
    creator: { 
        type: String, 
        ref: 'User', 
        required: true 
    },
    admins: [{ 
        type: String, 
        ref: 'User' 
    }],
    moderators: [{ 
        type: String, 
        ref: 'User' 
    }],
    members: [{ 
        user: { type: String, ref: 'User' },
        role: { type: String, enum: ['member', 'moderator', 'admin'], default: 'member' },
        joined_at: { type: Date, default: Date.now },
        muted: { type: Boolean, default: false },
        banned: { type: Boolean, default: false }
    }],
    pending_requests: [{ 
        user: { type: String, ref: 'User' },
        requested_at: { type: Date, default: Date.now },
        message: { type: String, default: '' }
    }],
    invited_members: [{ 
        user: { type: String, ref: 'User' },
        invited_by: { type: String, ref: 'User' },
        invited_at: { type: Date, default: Date.now },
        status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' }
    }],
    settings: {
        allow_member_posts: { type: Boolean, default: true },
        allow_member_invites: { type: Boolean, default: false },
        post_approval_required: { type: Boolean, default: false },
        allow_member_calls: { type: Boolean, default: true },
        allow_file_sharing: { type: Boolean, default: true },
        max_members: { type: Number, default: 1000 }
    },
    stats: {
        member_count: { type: Number, default: 0 },
        post_count: { type: Number, default: 0 },
        active_members_count: { type: Number, default: 0 }
    },
    is_active: { 
        type: Boolean, 
        default: true 
    },
    archived_at: { 
        type: Date 
    },
    featured: { 
        type: Boolean, 
        default: false 
    }
}, { 
    timestamps: true, 
    minimize: false 
});

// Indexes for better query performance
groupSchema.index({ creator: 1, createdAt: -1 });
groupSchema.index({ 'members.user': 1 });
groupSchema.index({ privacy: 1, is_active: 1 });
groupSchema.index({ category: 1, featured: -1 });
groupSchema.index({ name: 'text', description: 'text' });

// Pre-save middleware to update stats
groupSchema.pre('save', function(next) {
    if (this.isModified('members')) {
        this.stats.member_count = this.members.filter(member => !member.banned).length;
    }
    next();
});

// Methods
groupSchema.methods.addMember = function(userId, role = 'member', addedBy = null) {
    const existingMember = this.members.find(member => member.user.toString() === userId);
    if (existingMember) {
        return false; // Member already exists
    }
    
    this.members.push({
        user: userId,
        role: role,
        joined_at: new Date()
    });
    
    // Add to admins array if role is admin
    if (role === 'admin' && !this.admins.includes(userId)) {
        this.admins.push(userId);
    }
    
    // Add to moderators array if role is moderator
    if (role === 'moderator' && !this.moderators.includes(userId)) {
        this.moderators.push(userId);
    }
    
    return true;
};

groupSchema.methods.removeMember = function(userId) {
    this.members = this.members.filter(member => member.user.toString() !== userId);
    this.admins = this.admins.filter(admin => admin.toString() !== userId);
    this.moderators = this.moderators.filter(mod => mod.toString() !== userId);
    return true;
};

groupSchema.methods.updateMemberRole = function(userId, newRole) {
    const member = this.members.find(member => member.user.toString() === userId);
    if (!member) return false;
    
    // Remove from previous role arrays
    this.admins = this.admins.filter(admin => admin.toString() !== userId);
    this.moderators = this.moderators.filter(mod => mod.toString() !== userId);
    
    // Update member role
    member.role = newRole;
    
    // Add to new role array
    if (newRole === 'admin' && !this.admins.includes(userId)) {
        this.admins.push(userId);
    } else if (newRole === 'moderator' && !this.moderators.includes(userId)) {
        this.moderators.push(userId);
    }
    
    return true;
};

groupSchema.methods.isMember = function(userId) {
    return this.members.some(member => member.user.toString() === userId && !member.banned);
};

groupSchema.methods.isAdmin = function(userId) {
    return this.admins.includes(userId) || this.creator.toString() === userId;
};

groupSchema.methods.isModerator = function(userId) {
    return this.moderators.includes(userId) || this.isAdmin(userId);
};

const Group = mongoose.model('Group', groupSchema);

export default Group;
