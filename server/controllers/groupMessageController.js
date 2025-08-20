import GroupMessage from "../models/GroupMessage.js";
import Group from "../models/Group.js";
import User from "../models/User.js";
import { createNotification } from "./notificationController.js";

// Send message to group
export const sendGroupMessage = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { groupId } = req.params;
        const { text, message_type = 'text', media_url = '', reply_to = null, mentions = [] } = req.body;

        // Check if group exists and user is a member
        const group = await Group.findById(groupId);
        if (!group || !group.is_active) {
            return res.json({ success: false, message: "Group not found" });
        }

        if (!group.isMember(userId)) {
            return res.json({ success: false, message: "You are not a member of this group" });
        }

        // Create the message
        const groupMessage = await GroupMessage.create({
            group: groupId,
            sender: userId,
            text,
            message_type,
            media_url,
            reply_to,
            mentions
        });

        // Populate message data
        await groupMessage.populate('sender', 'full_name username profile_picture');
        await groupMessage.populate('reply_to');
        await groupMessage.populate('mentions', 'full_name username');

        // Mark as delivered to all group members
        const deliveredTo = group.members
            .filter(member => member.user.toString() !== userId)
            .map(member => ({
                user: member.user,
                delivered_at: new Date()
            }));

        groupMessage.delivered_to = deliveredTo;
        await groupMessage.save();

        // Send notifications to mentioned users
        if (mentions && mentions.length > 0) {
            const sender = await User.findById(userId);
            if (sender) {
                for (const mentionedUserId of mentions) {
                    if (mentionedUserId !== userId) {
                        await createNotification({
                            recipient: mentionedUserId,
                            sender: userId,
                            type: 'group_mention',
                            content: `${sender.full_name} mentioned you in ${group.name}`,
                            metadata: { 
                                groupId, 
                                groupName: group.name,
                                messageId: groupMessage._id 
                            }
                        });
                    }
                }
            }
        }

        res.json({
            success: true,
            message: groupMessage
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to send message" });
    }
};

// Get group messages
export const getGroupMessages = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { groupId } = req.params;
        const { page = 1, limit = 50, before = null } = req.query;

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
            deleted: false,
            $or: [
                { deleted_for: { $ne: userId } },
                { deleted_for: { $exists: false } }
            ]
        };

        // Add before filter for pagination
        if (before) {
            query.createdAt = { $lt: new Date(before) };
        }

        const messages = await GroupMessage.find(query)
            .populate('sender', 'full_name username profile_picture')
            .populate('reply_to')
            .populate('mentions', 'full_name username')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const totalMessages = await GroupMessage.countDocuments({
            group: groupId,
            deleted: false,
            $or: [
                { deleted_for: { $ne: userId } },
                { deleted_for: { $exists: false } }
            ]
        });

        // Mark messages as seen by current user
        const messageIds = messages.map(msg => msg._id);
        await GroupMessage.updateMany(
            {
                _id: { $in: messageIds },
                'seen_by.user': { $ne: userId }
            },
            {
                $push: {
                    seen_by: {
                        user: userId,
                        seen_at: new Date()
                    }
                }
            }
        );

        res.json({
            success: true,
            messages: messages.reverse(), // Return in chronological order
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalMessages / limit),
            totalMessages
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to get messages" });
    }
};

// Mark messages as seen
export const markMessagesAsSeen = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { groupId } = req.params;
        const { messageIds = [] } = req.body;

        // Check if group exists and user is a member
        const group = await Group.findById(groupId);
        if (!group || !group.is_active) {
            return res.json({ success: false, message: "Group not found" });
        }

        if (!group.isMember(userId)) {
            return res.json({ success: false, message: "You are not a member of this group" });
        }

        // Update messages
        await GroupMessage.updateMany(
            {
                _id: { $in: messageIds },
                group: groupId,
                'seen_by.user': { $ne: userId }
            },
            {
                $push: {
                    seen_by: {
                        user: userId,
                        seen_at: new Date()
                    }
                }
            }
        );

        res.json({
            success: true,
            message: "Messages marked as seen"
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to mark messages as seen" });
    }
};

// Add reaction to message
export const addReaction = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { groupId, messageId } = req.params;
        const { emoji } = req.body;

        // Check if group exists and user is a member
        const group = await Group.findById(groupId);
        if (!group || !group.is_active) {
            return res.json({ success: false, message: "Group not found" });
        }

        if (!group.isMember(userId)) {
            return res.json({ success: false, message: "You are not a member of this group" });
        }

        const message = await GroupMessage.findOne({ _id: messageId, group: groupId });
        if (!message) {
            return res.json({ success: false, message: "Message not found" });
        }

        message.addReaction(userId, emoji);
        await message.save();

        res.json({
            success: true,
            reactions: message.reactions
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to add reaction" });
    }
};

// Remove reaction from message
export const removeReaction = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { groupId, messageId } = req.params;
        const { emoji } = req.body;

        // Check if group exists and user is a member
        const group = await Group.findById(groupId);
        if (!group || !group.is_active) {
            return res.json({ success: false, message: "Group not found" });
        }

        if (!group.isMember(userId)) {
            return res.json({ success: false, message: "You are not a member of this group" });
        }

        const message = await GroupMessage.findOne({ _id: messageId, group: groupId });
        if (!message) {
            return res.json({ success: false, message: "Message not found" });
        }

        message.removeReaction(userId, emoji);
        await message.save();

        res.json({
            success: true,
            reactions: message.reactions
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to remove reaction" });
    }
};

// Delete message
export const deleteGroupMessage = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { groupId, messageId } = req.params;
        const { deleteFor = 'me' } = req.body; // 'me' or 'everyone'

        // Check if group exists and user is a member
        const group = await Group.findById(groupId);
        if (!group || !group.is_active) {
            return res.json({ success: false, message: "Group not found" });
        }

        if (!group.isMember(userId)) {
            return res.json({ success: false, message: "You are not a member of this group" });
        }

        const message = await GroupMessage.findOne({ _id: messageId, group: groupId });
        if (!message) {
            return res.json({ success: false, message: "Message not found" });
        }

        if (deleteFor === 'everyone') {
            // Check if user is message sender, admin, or moderator
            const canDeleteForEveryone = message.sender.toString() === userId ||
                                       group.isAdmin(userId) ||
                                       group.isModerator(userId);

            if (!canDeleteForEveryone) {
                return res.json({ success: false, message: "Insufficient permissions" });
            }

            message.deleted = true;
            message.deleted_at = new Date();
        } else {
            // Delete for current user only
            if (!message.deleted_for.includes(userId)) {
                message.deleted_for.push(userId);
            }
        }

        await message.save();

        res.json({
            success: true,
            message: deleteFor === 'everyone' ? "Message deleted for everyone" : "Message deleted for you"
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to delete message" });
    }
};

// Edit message
export const editGroupMessage = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { groupId, messageId } = req.params;
        const { text } = req.body;

        // Check if group exists and user is a member
        const group = await Group.findById(groupId);
        if (!group || !group.is_active) {
            return res.json({ success: false, message: "Group not found" });
        }

        if (!group.isMember(userId)) {
            return res.json({ success: false, message: "You are not a member of this group" });
        }

        const message = await GroupMessage.findOne({ 
            _id: messageId, 
            group: groupId,
            sender: userId,
            message_type: 'text'
        });

        if (!message) {
            return res.json({ success: false, message: "Message not found or cannot be edited" });
        }

        // Check if message is not too old (15 minutes limit)
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        if (message.createdAt < fifteenMinutesAgo) {
            return res.json({ success: false, message: "Message is too old to edit" });
        }

        message.text = text;
        message.edited = true;
        message.edited_at = new Date();
        await message.save();

        await message.populate('sender', 'full_name username profile_picture');

        res.json({
            success: true,
            message
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to edit message" });
    }
};

// Get unread message count for group
export const getUnreadCount = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { groupId } = req.params;

        // Check if group exists and user is a member
        const group = await Group.findById(groupId);
        if (!group || !group.is_active) {
            return res.json({ success: false, message: "Group not found" });
        }

        if (!group.isMember(userId)) {
            return res.json({ success: false, message: "You are not a member of this group" });
        }

        const unreadCount = await GroupMessage.countDocuments({
            group: groupId,
            deleted: false,
            sender: { $ne: userId },
            'seen_by.user': { $ne: userId },
            $or: [
                { deleted_for: { $ne: userId } },
                { deleted_for: { $exists: false } }
            ]
        });

        res.json({
            success: true,
            unreadCount
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to get unread count" });
    }
};
