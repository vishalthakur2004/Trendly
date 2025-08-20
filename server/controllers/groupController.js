import Group from "../models/Group.js";
import GroupPost from "../models/GroupPost.js";
import GroupMessage from "../models/GroupMessage.js";
import User from "../models/User.js";
import { createNotification } from "./notificationController.js";

// Generate unique group ID
const generateGroupId = () => {
    return `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Create a new group
export const createGroup = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { 
            name, 
            description, 
            privacy = 'public', 
            category = 'general',
            profile_picture = '',
            cover_photo = '',
            tags = [],
            settings = {}
        } = req.body;

        if (!name || name.trim().length === 0) {
            return res.json({ success: false, message: "Group name is required" });
        }

        const groupId = generateGroupId();

        // Default settings
        const defaultSettings = {
            allow_member_posts: true,
            allow_member_invites: false,
            post_approval_required: false,
            allow_member_calls: true,
            allow_file_sharing: true,
            max_members: 1000,
            ...settings
        };

        const group = await Group.create({
            _id: groupId,
            name: name.trim(),
            description: description || '',
            privacy,
            category,
            profile_picture,
            cover_photo,
            tags,
            creator: userId,
            admins: [userId],
            settings: defaultSettings,
            stats: {
                member_count: 1,
                post_count: 0,
                active_members_count: 1
            }
        });

        // Add creator as first member with admin role
        group.addMember(userId, 'admin');
        await group.save();

        // Populate group data
        await group.populate('creator members.user admins moderators');

        res.json({
            success: true,
            group,
            message: "Group created successfully"
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to create group" });
    }
};

// Get user's groups
export const getUserGroups = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { page = 1, limit = 20, filter = 'all' } = req.query;

        let query = {
            $and: [
                { is_active: true },
                { 'members.user': userId }
            ]
        };

        // Apply filters
        if (filter === 'created') {
            query.creator = userId;
        } else if (filter === 'admin') {
            query.admins = userId;
        }

        const groups = await Group.find(query)
            .populate('creator', 'full_name username profile_picture')
            .populate('members.user', 'full_name username profile_picture')
            .select('-pending_requests -invited_members')
            .sort({ updatedAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const totalGroups = await Group.countDocuments(query);

        res.json({
            success: true,
            groups,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalGroups / limit),
            totalGroups
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to get groups" });
    }
};

// Get group details
export const getGroupDetails = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { groupId } = req.params;

        const group = await Group.findById(groupId)
            .populate('creator', 'full_name username profile_picture')
            .populate('members.user', 'full_name username profile_picture')
            .populate('admins', 'full_name username profile_picture')
            .populate('moderators', 'full_name username profile_picture');

        if (!group || !group.is_active) {
            return res.json({ success: false, message: "Group not found" });
        }

        // Check if user is a member (for private groups)
        if (group.privacy === 'private' || group.privacy === 'secret') {
            if (!group.isMember(userId)) {
                return res.json({ success: false, message: "Access denied" });
            }
        }

        res.json({
            success: true,
            group
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to get group details" });
    }
};

// Update group
export const updateGroup = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { groupId } = req.params;
        const updates = req.body;

        const group = await Group.findById(groupId);
        if (!group || !group.is_active) {
            return res.json({ success: false, message: "Group not found" });
        }

        // Check if user is admin
        if (!group.isAdmin(userId)) {
            return res.json({ success: false, message: "Only admins can update group settings" });
        }

        // Update allowed fields
        const allowedUpdates = ['name', 'description', 'profile_picture', 'cover_photo', 'category', 'tags', 'settings'];
        allowedUpdates.forEach(field => {
            if (updates[field] !== undefined) {
                group[field] = updates[field];
            }
        });

        await group.save();
        await group.populate('creator members.user admins moderators');

        res.json({
            success: true,
            group,
            message: "Group updated successfully"
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to update group" });
    }
};

// Join group (for public groups)
export const joinGroup = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { groupId } = req.params;

        const group = await Group.findById(groupId);
        if (!group || !group.is_active) {
            return res.json({ success: false, message: "Group not found" });
        }

        // Check if already a member
        if (group.isMember(userId)) {
            return res.json({ success: false, message: "You are already a member of this group" });
        }

        // Check group privacy
        if (group.privacy === 'private' || group.privacy === 'secret') {
            return res.json({ success: false, message: "You need an invitation to join this group" });
        }

        // Check max members limit
        if (group.stats.member_count >= group.settings.max_members) {
            return res.json({ success: false, message: "Group has reached maximum member limit" });
        }

        // Add member
        group.addMember(userId, 'member');
        await group.save();

        // Create system message
        const systemMessage = await GroupMessage.create({
            group: groupId,
            sender: userId,
            text: '',
            message_type: 'system',
            system_data: {
                action: 'member_joined',
                target_user: userId,
                performed_by: userId
            }
        });

        // Notify group admins
        const user = await User.findById(userId);
        if (user) {
            for (const adminId of group.admins) {
                if (adminId !== userId) {
                    await createNotification({
                        recipient: adminId,
                        sender: userId,
                        type: 'group_member_joined',
                        content: `${user.full_name} joined ${group.name}`,
                        metadata: { groupId, groupName: group.name }
                    });
                }
            }
        }

        await group.populate('creator members.user admins moderators');

        res.json({
            success: true,
            group,
            message: "Successfully joined the group"
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to join group" });
    }
};

// Leave group
export const leaveGroup = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { groupId } = req.params;

        const group = await Group.findById(groupId);
        if (!group || !group.is_active) {
            return res.json({ success: false, message: "Group not found" });
        }

        // Check if user is a member
        if (!group.isMember(userId)) {
            return res.json({ success: false, message: "You are not a member of this group" });
        }

        // Prevent creator from leaving (they must transfer ownership first)
        if (group.creator.toString() === userId) {
            return res.json({ success: false, message: "Group creator cannot leave. Please transfer ownership first." });
        }

        // Remove member
        group.removeMember(userId);
        await group.save();

        // Create system message
        const systemMessage = await GroupMessage.create({
            group: groupId,
            sender: userId,
            text: '',
            message_type: 'system',
            system_data: {
                action: 'member_left',
                target_user: userId,
                performed_by: userId
            }
        });

        res.json({
            success: true,
            message: "Successfully left the group"
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to leave group" });
    }
};

// Invite member to group
export const inviteMember = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { groupId } = req.params;
        const { memberId } = req.body;

        const group = await Group.findById(groupId);
        if (!group || !group.is_active) {
            return res.json({ success: false, message: "Group not found" });
        }

        // Check permissions
        if (!group.isMember(userId)) {
            return res.json({ success: false, message: "You are not a member of this group" });
        }

        if (!group.settings.allow_member_invites && !group.isAdmin(userId)) {
            return res.json({ success: false, message: "Only admins can invite members" });
        }

        // Check if user exists
        const invitedUser = await User.findById(memberId);
        if (!invitedUser) {
            return res.json({ success: false, message: "User not found" });
        }

        // Check if already a member
        if (group.isMember(memberId)) {
            return res.json({ success: false, message: "User is already a member" });
        }

        // Check if already invited
        const existingInvite = group.invited_members.find(
            invite => invite.user.toString() === memberId && invite.status === 'pending'
        );
        if (existingInvite) {
            return res.json({ success: false, message: "User has already been invited" });
        }

        // Add to invited members
        group.invited_members.push({
            user: memberId,
            invited_by: userId,
            invited_at: new Date(),
            status: 'pending'
        });

        await group.save();

        // Create notification
        const inviter = await User.findById(userId);
        if (inviter) {
            await createNotification({
                recipient: memberId,
                sender: userId,
                type: 'group_invitation',
                content: `${inviter.full_name} invited you to join ${group.name}`,
                metadata: { groupId, groupName: group.name }
            });
        }

        res.json({
            success: true,
            message: "Invitation sent successfully"
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to send invitation" });
    }
};

// Accept group invitation
export const acceptInvitation = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { groupId } = req.params;

        const group = await Group.findById(groupId);
        if (!group || !group.is_active) {
            return res.json({ success: false, message: "Group not found" });
        }

        // Find invitation
        const invitation = group.invited_members.find(
            invite => invite.user.toString() === userId && invite.status === 'pending'
        );
        if (!invitation) {
            return res.json({ success: false, message: "No pending invitation found" });
        }

        // Check max members limit
        if (group.stats.member_count >= group.settings.max_members) {
            return res.json({ success: false, message: "Group has reached maximum member limit" });
        }

        // Add member and update invitation status
        group.addMember(userId, 'member');
        invitation.status = 'accepted';
        await group.save();

        // Create system message
        const systemMessage = await GroupMessage.create({
            group: groupId,
            sender: userId,
            text: '',
            message_type: 'system',
            system_data: {
                action: 'member_joined',
                target_user: userId,
                performed_by: invitation.invited_by
            }
        });

        await group.populate('creator members.user admins moderators');

        res.json({
            success: true,
            group,
            message: "Successfully joined the group"
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to accept invitation" });
    }
};

// Remove member from group
export const removeMember = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { groupId } = req.params;
        const { memberId } = req.body;

        const group = await Group.findById(groupId);
        if (!group || !group.is_active) {
            return res.json({ success: false, message: "Group not found" });
        }

        // Check if user is admin or moderator
        if (!group.isAdmin(userId) && !group.isModerator(userId)) {
            return res.json({ success: false, message: "Insufficient permissions" });
        }

        // Cannot remove creator
        if (group.creator.toString() === memberId) {
            return res.json({ success: false, message: "Cannot remove group creator" });
        }

        // Cannot remove higher-ranked members
        const targetMember = group.members.find(m => m.user.toString() === memberId);
        if (!targetMember) {
            return res.json({ success: false, message: "Member not found" });
        }

        if (targetMember.role === 'admin' && !group.isAdmin(userId)) {
            return res.json({ success: false, message: "Cannot remove admin" });
        }

        // Remove member
        group.removeMember(memberId);
        await group.save();

        // Create system message
        const systemMessage = await GroupMessage.create({
            group: groupId,
            sender: userId,
            text: '',
            message_type: 'system',
            system_data: {
                action: 'member_removed',
                target_user: memberId,
                performed_by: userId
            }
        });

        // Notify removed member
        const removedUser = await User.findById(memberId);
        const remover = await User.findById(userId);
        if (removedUser && remover) {
            await createNotification({
                recipient: memberId,
                sender: userId,
                type: 'group_member_removed',
                content: `You were removed from ${group.name} by ${remover.full_name}`,
                metadata: { groupId, groupName: group.name }
            });
        }

        res.json({
            success: true,
            message: "Member removed successfully"
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to remove member" });
    }
};

// Update member role
export const updateMemberRole = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { groupId } = req.params;
        const { memberId, newRole } = req.body;

        const group = await Group.findById(groupId);
        if (!group || !group.is_active) {
            return res.json({ success: false, message: "Group not found" });
        }

        // Only admins can change roles
        if (!group.isAdmin(userId)) {
            return res.json({ success: false, message: "Only admins can change member roles" });
        }

        // Cannot change creator role
        if (group.creator.toString() === memberId) {
            return res.json({ success: false, message: "Cannot change creator role" });
        }

        // Validate new role
        if (!['member', 'moderator', 'admin'].includes(newRole)) {
            return res.json({ success: false, message: "Invalid role" });
        }

        // Update role
        const success = group.updateMemberRole(memberId, newRole);
        if (!success) {
            return res.json({ success: false, message: "Member not found" });
        }

        await group.save();

        // Create system message
        const systemMessage = await GroupMessage.create({
            group: groupId,
            sender: userId,
            text: '',
            message_type: 'system',
            system_data: {
                action: 'role_changed',
                target_user: memberId,
                performed_by: userId,
                additional_data: { newRole }
            }
        });

        res.json({
            success: true,
            message: "Member role updated successfully"
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to update member role" });
    }
};

// Search/discover groups
export const discoverGroups = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { 
            search = '', 
            category = '', 
            page = 1, 
            limit = 20,
            privacy = 'public'
        } = req.query;

        let query = {
            is_active: true,
            privacy: privacy
        };

        // Add search criteria
        if (search.trim()) {
            query.$text = { $search: search.trim() };
        }

        if (category) {
            query.category = category;
        }

        // Exclude groups user is already a member of
        query['members.user'] = { $ne: userId };

        const groups = await Group.find(query)
            .populate('creator', 'full_name username profile_picture')
            .select('name description profile_picture category privacy stats creator createdAt')
            .sort({ featured: -1, 'stats.member_count': -1, createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const totalGroups = await Group.countDocuments(query);

        res.json({
            success: true,
            groups,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalGroups / limit),
            totalGroups
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to discover groups" });
    }
};

// Delete group (creator only)
export const deleteGroup = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { groupId } = req.params;

        const group = await Group.findById(groupId);
        if (!group || !group.is_active) {
            return res.json({ success: false, message: "Group not found" });
        }

        // Only creator can delete group
        if (group.creator.toString() !== userId) {
            return res.json({ success: false, message: "Only group creator can delete the group" });
        }

        // Soft delete - mark as inactive
        group.is_active = false;
        group.archived_at = new Date();
        await group.save();

        // Notify all members
        for (const member of group.members) {
            if (member.user.toString() !== userId) {
                await createNotification({
                    recipient: member.user,
                    sender: userId,
                    type: 'group_deleted',
                    content: `${group.name} has been deleted`,
                    metadata: { groupId, groupName: group.name }
                });
            }
        }

        res.json({
            success: true,
            message: "Group deleted successfully"
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to delete group" });
    }
};
