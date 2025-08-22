import Notification from "../models/Notification.js";
import User from "../models/User.js";

// Get User Notifications
export const getNotifications = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { page = 1, limit = 20, unread_only = false } = req.query;

        const filter = { recipient: userId };
        if (unread_only === 'true') {
            filter.is_read = false;
        }

        const notifications = await Notification.find(filter)
            .populate('sender', 'full_name username profile_picture')
            .populate('related_post', 'content image_urls')
            .populate('related_comment', 'content')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        // Get unread count
        const unreadCount = await Notification.countDocuments({ 
            recipient: userId, 
            is_read: false 
        });

        res.json({ 
            success: true, 
            notifications, 
            unreadCount,
            currentPage: parseInt(page),
            totalPages: Math.ceil(await Notification.countDocuments(filter) / limit)
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to load notifications" });
    }
};

// Mark Notification as Read
export const markAsRead = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { notificationId } = req.body;

        if (notificationId) {
            // Mark single notification as read
            const notification = await Notification.findOneAndUpdate(
                { _id: notificationId, recipient: userId },
                { is_read: true },
                { new: true }
            );
            
            if (!notification) {
                return res.json({ success: false, message: "Notification not found" });
            }
        } else {
            // Mark all notifications as read
            await Notification.updateMany(
                { recipient: userId, is_read: false },
                { is_read: true }
            );
        }

        res.json({ success: true, message: "Notification(s) marked as read" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to mark notification as read" });
    }
};

// Delete Notification
export const deleteNotification = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { notificationId } = req.body;

        const notification = await Notification.findOneAndDelete({
            _id: notificationId,
            recipient: userId
        });

        if (!notification) {
            return res.json({ success: false, message: "Notification not found" });
        }

        res.json({ success: true, message: "Notification deleted successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to delete notification" });
    }
};

// Get Notification Statistics
export const getNotificationStats = async (req, res) => {
    try {
        const { userId } = req.auth();

        const stats = await Notification.aggregate([
            { $match: { recipient: userId } },
            {
                $group: {
                    _id: "$type",
                    count: { $sum: 1 },
                    unread: {
                        $sum: {
                            $cond: [{ $eq: ["$is_read", false] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        const totalUnread = await Notification.countDocuments({
            recipient: userId,
            is_read: false
        });

        res.json({ success: true, stats, totalUnread });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to load notification statistics" });
    }
};

// Create Notification (Helper function used by other controllers)
export const createNotification = async ({
    recipient,
    sender,
    type,
    content,
    related_post = null,
    related_comment = null,
    related_message = null,
    action_url = null,
    metadata = {}
}) => {
    try {
        // Don't create notification if sender is the same as recipient
        if (recipient === sender) {
            return null;
        }

        // Check for duplicate notifications (prevent spam)
        const existingNotification = await Notification.findOne({
            recipient,
            sender,
            type,
            related_post,
            related_comment,
            createdAt: { $gte: new Date(Date.now() - 60000) } // Within last minute
        });

        if (existingNotification) {
            return existingNotification;
        }

        const notification = await Notification.create({
            recipient,
            sender,
            type,
            content,
            related_post,
            related_comment,
            related_message,
            action_url,
            metadata
        });

        return await notification.populate('sender', 'full_name username profile_picture');
    } catch (error) {
        console.log('Error creating notification:', error);
        return null;
    }
};

// Helper function to generate notification content
export const generateNotificationContent = (type, senderName, metadata = {}) => {
    switch (type) {
        case 'like':
            return `${senderName} liked your post`;
        case 'comment':
            return `${senderName} commented on your post`;
        case 'reply':
            return `${senderName} replied to your comment`;
        case 'follow':
            return `${senderName} started following you`;
        case 'message':
            return `${senderName} sent you a message`;
        case 'share':
            return `${senderName} shared your post`;
        case 'comment_like':
            return `${senderName} liked your comment`;
        case 'mention':
            return `${senderName} mentioned you in a ${metadata.context || 'post'}`;
        case 'call':
            const callType = metadata.callType || 'voice';
            return `${senderName} is calling you (${callType} call)`;
        case 'missed_call':
            const missedCallType = metadata.callType || 'voice';
            if (metadata.isGroupCall) {
                return `Missed group ${missedCallType} call from ${senderName}`;
            }
            return `Missed ${missedCallType} call from ${senderName}`;
        case 'group_call':
            const groupCallType = metadata.callType || 'voice';
            const groupName = metadata.groupName || 'group';
            return `${senderName} started a ${groupCallType} call in ${groupName}`;
        default:
            return `${senderName} interacted with your content`;
    }
};
