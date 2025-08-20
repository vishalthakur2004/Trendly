import GroupPost from "../models/GroupPost.js";
import Group from "../models/Group.js";
import User from "../models/User.js";
import { createNotification } from "./notificationController.js";

// Create a new group post
export const createGroupPost = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { groupId } = req.params;
        const { 
            content, 
            image_urls = [], 
            post_type, 
            is_announcement = false,
            poll_data = null,
            event_data = null,
            visibility = 'all_members'
        } = req.body;

        // Check if group exists and user is a member
        const group = await Group.findById(groupId);
        if (!group || !group.is_active) {
            return res.json({ success: false, message: "Group not found" });
        }

        if (!group.isMember(userId)) {
            return res.json({ success: false, message: "You are not a member of this group" });
        }

        // Check permissions
        if (!group.settings.allow_member_posts && !group.isAdmin(userId) && !group.isModerator(userId)) {
            return res.json({ success: false, message: "Only admins and moderators can create posts in this group" });
        }

        if (is_announcement && !group.isAdmin(userId) && !group.isModerator(userId)) {
            return res.json({ success: false, message: "Only admins and moderators can create announcements" });
        }

        // Determine approval status
        let approval_status = 'approved';
        if (group.settings.post_approval_required && !group.isAdmin(userId) && !group.isModerator(userId)) {
            approval_status = 'pending';
        }

        // Create the post
        const groupPost = await GroupPost.create({
            group: groupId,
            user: userId,
            content,
            image_urls,
            post_type,
            is_announcement,
            poll_data,
            event_data,
            visibility,
            approval_status
        });

        // Update group stats if approved
        if (approval_status === 'approved') {
            group.stats.post_count += 1;
            await group.save();
        }

        // Populate post data
        await groupPost.populate('user', 'full_name username profile_picture');
        await groupPost.populate('group', 'name');

        // Notify group members (if approved and not announcement)
        if (approval_status === 'approved' && !is_announcement) {
            const poster = await User.findById(userId);
            if (poster) {
                // Notify a subset of active members to avoid spam
                const membersToNotify = group.members
                    .filter(member => member.user.toString() !== userId)
                    .slice(0, 10); // Limit to 10 notifications

                for (const member of membersToNotify) {
                    await createNotification({
                        recipient: member.user,
                        sender: userId,
                        type: 'group_post',
                        content: `${poster.full_name} posted in ${group.name}`,
                        metadata: { 
                            groupId, 
                            groupName: group.name,
                            postId: groupPost._id 
                        }
                    });
                }
            }
        }

        // Notify admins if post needs approval
        if (approval_status === 'pending') {
            const poster = await User.findById(userId);
            if (poster) {
                for (const adminId of group.admins) {
                    await createNotification({
                        recipient: adminId,
                        sender: userId,
                        type: 'group_post_approval',
                        content: `${poster.full_name} posted in ${group.name} - approval required`,
                        metadata: { 
                            groupId, 
                            groupName: group.name,
                            postId: groupPost._id 
                        }
                    });
                }
            }
        }

        res.json({
            success: true,
            post: groupPost,
            message: approval_status === 'pending' 
                ? "Post submitted for approval" 
                : "Post created successfully"
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to create post" });
    }
};

// Get group posts (feed)
export const getGroupPosts = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { groupId } = req.params;
        const { page = 1, limit = 20, filter = 'all' } = req.query;

        // Check if group exists and user is a member
        const group = await Group.findById(groupId);
        if (!group || !group.is_active) {
            return res.json({ success: false, message: "Group not found" });
        }

        if (!group.isMember(userId)) {
            return res.json({ success: false, message: "You are not a member of this group" });
        }

        let query = {
            group: groupId,
            approval_status: 'approved'
        };

        // Apply filters
        if (filter === 'announcements') {
            query.is_announcement = true;
        } else if (filter === 'pinned') {
            query.is_pinned = true;
        } else if (filter === 'my_posts') {
            query.user = userId;
        }

        // Check visibility permissions
        if (!group.isAdmin(userId) && !group.isModerator(userId)) {
            query.visibility = { $in: ['all_members'] };
        }

        const posts = await GroupPost.find(query)
            .populate('user', 'full_name username profile_picture')
            .populate('group', 'name profile_picture')
            .sort({ is_pinned: -1, is_announcement: -1, createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const totalPosts = await GroupPost.countDocuments(query);

        res.json({
            success: true,
            posts,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalPosts / limit),
            totalPosts
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to get group posts" });
    }
};

// Get pending posts (for admins)
export const getPendingPosts = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { groupId } = req.params;

        // Check if group exists and user is admin/moderator
        const group = await Group.findById(groupId);
        if (!group || !group.is_active) {
            return res.json({ success: false, message: "Group not found" });
        }

        if (!group.isAdmin(userId) && !group.isModerator(userId)) {
            return res.json({ success: false, message: "Insufficient permissions" });
        }

        const pendingPosts = await GroupPost.find({
            group: groupId,
            approval_status: 'pending'
        })
        .populate('user', 'full_name username profile_picture')
        .sort({ createdAt: -1 });

        res.json({
            success: true,
            posts: pendingPosts
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to get pending posts" });
    }
};

// Approve/reject post
export const moderatePost = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { groupId, postId } = req.params;
        const { action } = req.body; // 'approve' or 'reject'

        // Check if group exists and user is admin/moderator
        const group = await Group.findById(groupId);
        if (!group || !group.is_active) {
            return res.json({ success: false, message: "Group not found" });
        }

        if (!group.isAdmin(userId) && !group.isModerator(userId)) {
            return res.json({ success: false, message: "Insufficient permissions" });
        }

        const post = await GroupPost.findOne({ _id: postId, group: groupId });
        if (!post) {
            return res.json({ success: false, message: "Post not found" });
        }

        if (action === 'approve') {
            post.approval_status = 'approved';
            post.approved_by = userId;
            post.approved_at = new Date();
            
            // Update group stats
            group.stats.post_count += 1;
            await group.save();

            // Notify post author
            const approver = await User.findById(userId);
            if (approver) {
                await createNotification({
                    recipient: post.user,
                    sender: userId,
                    type: 'group_post_approved',
                    content: `Your post in ${group.name} was approved`,
                    metadata: { 
                        groupId, 
                        groupName: group.name,
                        postId: post._id 
                    }
                });
            }
        } else if (action === 'reject') {
            post.approval_status = 'rejected';
            
            // Notify post author
            const rejector = await User.findById(userId);
            if (rejector) {
                await createNotification({
                    recipient: post.user,
                    sender: userId,
                    type: 'group_post_rejected',
                    content: `Your post in ${group.name} was rejected`,
                    metadata: { 
                        groupId, 
                        groupName: group.name,
                        postId: post._id 
                    }
                });
            }
        }

        await post.save();

        res.json({
            success: true,
            message: `Post ${action}d successfully`
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to moderate post" });
    }
};

// Like/unlike group post
export const toggleLikeGroupPost = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { groupId, postId } = req.params;

        // Check if group exists and user is a member
        const group = await Group.findById(groupId);
        if (!group || !group.is_active) {
            return res.json({ success: false, message: "Group not found" });
        }

        if (!group.isMember(userId)) {
            return res.json({ success: false, message: "You are not a member of this group" });
        }

        const post = await GroupPost.findOne({ _id: postId, group: groupId });
        if (!post) {
            return res.json({ success: false, message: "Post not found" });
        }

        const isLiked = post.likes_count.includes(userId);
        
        if (isLiked) {
            post.likes_count = post.likes_count.filter(id => id !== userId);
        } else {
            post.likes_count.push(userId);
            
            // Notify post author (if not self-like)
            if (post.user.toString() !== userId) {
                const liker = await User.findById(userId);
                if (liker) {
                    await createNotification({
                        recipient: post.user,
                        sender: userId,
                        type: 'group_post_like',
                        content: `${liker.full_name} liked your post in ${group.name}`,
                        metadata: { 
                            groupId, 
                            groupName: group.name,
                            postId: post._id 
                        }
                    });
                }
            }
        }

        await post.save();

        res.json({
            success: true,
            isLiked: !isLiked,
            likesCount: post.likes_count.length
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to toggle like" });
    }
};

// Pin/unpin post
export const togglePinPost = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { groupId, postId } = req.params;

        // Check if group exists and user is admin/moderator
        const group = await Group.findById(groupId);
        if (!group || !group.is_active) {
            return res.json({ success: false, message: "Group not found" });
        }

        if (!group.isAdmin(userId) && !group.isModerator(userId)) {
            return res.json({ success: false, message: "Only admins and moderators can pin posts" });
        }

        const post = await GroupPost.findOne({ _id: postId, group: groupId });
        if (!post) {
            return res.json({ success: false, message: "Post not found" });
        }

        post.is_pinned = !post.is_pinned;
        await post.save();

        res.json({
            success: true,
            isPinned: post.is_pinned,
            message: post.is_pinned ? "Post pinned" : "Post unpinned"
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to toggle pin" });
    }
};

// Delete group post
export const deleteGroupPost = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { groupId, postId } = req.params;

        // Check if group exists
        const group = await Group.findById(groupId);
        if (!group || !group.is_active) {
            return res.json({ success: false, message: "Group not found" });
        }

        const post = await GroupPost.findOne({ _id: postId, group: groupId });
        if (!post) {
            return res.json({ success: false, message: "Post not found" });
        }

        // Check permissions (post author, admin, or moderator can delete)
        const canDelete = post.user.toString() === userId || 
                         group.isAdmin(userId) || 
                         group.isModerator(userId);

        if (!canDelete) {
            return res.json({ success: false, message: "Insufficient permissions" });
        }

        await GroupPost.findByIdAndDelete(postId);

        // Update group stats
        if (post.approval_status === 'approved') {
            group.stats.post_count = Math.max(0, group.stats.post_count - 1);
            await group.save();
        }

        res.json({
            success: true,
            message: "Post deleted successfully"
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to delete post" });
    }
};

// Vote on poll
export const voteOnPoll = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { groupId, postId } = req.params;
        const { optionIndex } = req.body;

        // Check if group exists and user is a member
        const group = await Group.findById(groupId);
        if (!group || !group.is_active) {
            return res.json({ success: false, message: "Group not found" });
        }

        if (!group.isMember(userId)) {
            return res.json({ success: false, message: "You are not a member of this group" });
        }

        const post = await GroupPost.findOne({ _id: postId, group: groupId, post_type: 'poll' });
        if (!post || !post.poll_data) {
            return res.json({ success: false, message: "Poll not found" });
        }

        // Check if poll has expired
        if (post.poll_data.expires_at && new Date() > post.poll_data.expires_at) {
            return res.json({ success: false, message: "Poll has expired" });
        }

        // Validate option index
        if (optionIndex < 0 || optionIndex >= post.poll_data.options.length) {
            return res.json({ success: false, message: "Invalid option" });
        }

        // Remove previous votes if not multiple choice
        if (!post.poll_data.multiple_choice) {
            post.poll_data.options.forEach(option => {
                option.votes = option.votes.filter(vote => vote !== userId);
            });
        }

        // Check if user already voted for this option
        const option = post.poll_data.options[optionIndex];
        const hasVoted = option.votes.includes(userId);

        if (hasVoted) {
            // Remove vote
            option.votes = option.votes.filter(vote => vote !== userId);
        } else {
            // Add vote
            option.votes.push(userId);
        }

        await post.save();

        res.json({
            success: true,
            poll_data: post.poll_data,
            message: hasVoted ? "Vote removed" : "Vote recorded"
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to vote on poll" });
    }
};
