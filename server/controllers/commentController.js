import Comment from "../models/Comment.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import { createNotification, generateNotificationContent } from "./notificationController.js";

// Add Comment
export const addComment = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { postId, content, parentCommentId } = req.body;

        if (!content?.trim()) {
            return res.json({ success: false, message: "Comment content is required" });
        }

        // Check if post exists
        const post = await Post.findById(postId);
        if (!post) {
            return res.json({ success: false, message: "Post not found" });
        }

        // If it's a reply, check if parent comment exists
        let parentComment = null;
        if (parentCommentId) {
            parentComment = await Comment.findById(parentCommentId);
            if (!parentComment) {
                return res.json({ success: false, message: "Parent comment not found" });
            }
        }

        // Create comment
        const comment = await Comment.create({
            post: postId,
            user: userId,
            content: content.trim(),
            parent_comment: parentCommentId || null,
            is_reply: !!parentCommentId
        });

        // Update counters
        if (parentCommentId) {
            // Increment replies count for parent comment
            await Comment.findByIdAndUpdate(parentCommentId, { $inc: { replies_count: 1 } });
        } else {
            // Increment comments count for post
            await Post.findByIdAndUpdate(postId, { $inc: { comments_count: 1 } });
        }

        // Populate user data
        await comment.populate('user');

        // Create notifications
        const commenter = await User.findById(userId);
        if (commenter) {
            if (parentCommentId) {
                // Notification for reply
                if (parentComment.user !== userId) {
                    await createNotification({
                        recipient: parentComment.user,
                        sender: userId,
                        type: 'reply',
                        content: generateNotificationContent('reply', commenter.full_name),
                        related_post: postId,
                        related_comment: comment._id,
                        action_url: `/feed?post=${postId}&comment=${comment._id}`
                    });
                }
            } else {
                // Notification for comment
                if (post.user !== userId) {
                    await createNotification({
                        recipient: post.user,
                        sender: userId,
                        type: 'comment',
                        content: generateNotificationContent('comment', commenter.full_name),
                        related_post: postId,
                        related_comment: comment._id,
                        action_url: `/feed?post=${postId}&comment=${comment._id}`
                    });
                }
            }
        }

        res.json({ success: true, message: "Comment added successfully", comment });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to add comment. Please try again." });
    }
};

// Get Comments for a Post
export const getComments = async (req, res) => {
    try {
        const { postId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        // Get main comments (not replies)
        const comments = await Comment.find({ 
            post: postId, 
            is_reply: false 
        })
        .populate('user')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

        // Get replies for each comment (limit to 3 most recent)
        const commentsWithReplies = await Promise.all(
            comments.map(async (comment) => {
                const replies = await Comment.find({ 
                    parent_comment: comment._id 
                })
                .populate('user')
                .sort({ createdAt: 1 })
                .limit(3);

                return {
                    ...comment.toObject(),
                    replies
                };
            })
        );

        res.json({ success: true, comments: commentsWithReplies });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to load comments" });
    }
};

// Get Replies for a Comment
export const getReplies = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const replies = await Comment.find({ 
            parent_comment: commentId 
        })
        .populate('user')
        .sort({ createdAt: 1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

        res.json({ success: true, replies });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to load replies" });
    }
};

// Like/Unlike Comment
export const likeComment = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { commentId } = req.body;

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.json({ success: false, message: "Comment not found" });
        }

        const isLiked = comment.likes.includes(userId);

        if (isLiked) {
            // Unlike comment
            comment.likes = comment.likes.filter(id => id !== userId);
            await comment.save();
            res.json({ success: true, message: "Comment unliked" });
        } else {
            // Like comment
            comment.likes.push(userId);
            await comment.save();

            // Create notification for comment like
            if (comment.user !== userId) {
                const liker = await User.findById(userId);
                if (liker) {
                    await createNotification({
                        recipient: comment.user,
                        sender: userId,
                        type: 'comment_like',
                        content: generateNotificationContent('comment_like', liker.full_name),
                        related_comment: comment._id,
                        action_url: `/feed?comment=${comment._id}`
                    });
                }
            }

            res.json({ success: true, message: "Comment liked" });
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to like comment. Please try again." });
    }
};

// Delete Comment
export const deleteComment = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { commentId } = req.body;

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.json({ success: false, message: "Comment not found" });
        }

        // Check if user owns the comment
        if (comment.user !== userId) {
            return res.json({ success: false, message: "You can only delete your own comments" });
        }

        // Delete all replies to this comment
        await Comment.deleteMany({ parent_comment: commentId });

        // Update counters
        if (comment.is_reply) {
            // Decrement parent comment replies count
            await Comment.findByIdAndUpdate(comment.parent_comment, { $inc: { replies_count: -1 } });
        } else {
            // Decrement post comments count (include replies count)
            const deletedRepliesCount = comment.replies_count;
            await Post.findByIdAndUpdate(comment.post, { $inc: { comments_count: -(1 + deletedRepliesCount) } });
        }

        // Delete the comment
        await Comment.findByIdAndDelete(commentId);

        res.json({ success: true, message: "Comment deleted successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to delete comment. Please try again." });
    }
};
