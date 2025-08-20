import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    user: { type: String, ref: 'User', required: true },
    content: { type: String, required: true, trim: true },
    likes: [{ type: String, ref: 'User' }],
    parent_comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null }, // For replies
    replies_count: { type: Number, default: 0 },
    is_reply: { type: Boolean, default: false }
}, { timestamps: true, minimize: false });

// Index for better query performance
commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ parent_comment: 1, createdAt: 1 });

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
