import Call from "../models/Call.js";
import User from "../models/User.js";
import Group from "../models/Group.js";
import { createNotification, generateNotificationContent } from "./notificationController.js";

// Initiate a call
export const initiateCall = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { recipientId, callType, isGroupCall = false, groupId = null } = req.body;

        if (!callType) {
            return res.json({ success: false, message: "Call type is required" });
        }

        let participants = [];
        let callName = '';

        if (groupId) {
            // Group call
            const group = await Group.findById(groupId);
            if (!group || !group.is_active) {
                return res.json({ success: false, message: "Group not found" });
            }

            // Check if user is a member and calling is allowed
            if (!group.isMember(userId)) {
                return res.json({ success: false, message: "You are not a member of this group" });
            }

            if (!group.settings.allow_member_calls && !group.isAdmin(userId) && !group.isModerator(userId)) {
                return res.json({ success: false, message: "Group calls are not allowed" });
            }

            // Get all group members except initiator
            participants = group.members
                .filter(member => member.user.toString() !== userId)
                .map(member => member.user);

            callName = group.name;
        } else if (recipientId) {
            // Direct call
            const recipient = await User.findById(recipientId);
            if (!recipient) {
                return res.json({ success: false, message: "Recipient not found" });
            }
            participants = [recipientId];
        } else {
            return res.json({ success: false, message: "Recipient ID or Group ID is required" });
        }

        // Generate unique call ID
        const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Create call record
        const call = await Call.create({
            call_id: callId,
            initiator: userId,
            participants: participants,
            call_type: callType,
            is_group_call: groupId ? true : isGroupCall,
            group_id: groupId,
            status: 'initiated'
        });

        // Populate call data
        await call.populate('initiator participants');

        // Create notifications for participants
        const initiator = await User.findById(userId);
        if (initiator) {
            const notificationContent = groupId
                ? `${initiator.full_name} started a ${callType} call in ${callName}`
                : `${initiator.full_name} is calling you`;

            for (const participantId of participants) {
                await createNotification({
                    recipient: participantId,
                    sender: userId,
                    type: groupId ? 'group_call' : 'call',
                    content: notificationContent,
                    metadata: {
                        callId,
                        callType,
                        isGroupCall: groupId ? true : isGroupCall,
                        groupId,
                        groupName: callName
                    }
                });
            }
        }

        res.json({ 
            success: true, 
            call,
            message: "Call initiated successfully" 
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to initiate call" });
    }
};

// Update call status
export const updateCallStatus = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { callId, status, duration } = req.body;

        const call = await Call.findOne({ call_id: callId });
        if (!call) {
            return res.json({ success: false, message: "Call not found" });
        }

        // Check if user is participant in the call
        const isParticipant = call.initiator === userId || call.participants.includes(userId);
        if (!isParticipant) {
            return res.json({ success: false, message: "Unauthorized to update this call" });
        }

        // Update call status
        call.status = status;

        if (status === 'active' && !call.started_at) {
            call.started_at = new Date();
        }

        if (status === 'ended' || status === 'missed' || status === 'declined') {
            call.ended_at = new Date();
            if (duration) {
                call.duration = duration;
            } else if (call.started_at) {
                call.duration = Math.floor((Date.now() - call.started_at.getTime()) / 1000);
            }

            // Create missed call notifications for participants who didn't answer
            if (status === 'missed') {
                const caller = await User.findById(call.initiator);
                if (caller) {
                    for (const participantId of call.participants) {
                        await createNotification({
                            recipient: participantId,
                            sender: call.initiator,
                            type: 'missed_call',
                            content: `Missed ${call.call_type} call from ${caller.full_name}`,
                            metadata: {
                                callId: call.call_id,
                                callType: call.call_type,
                                isGroupCall: call.is_group_call,
                                missedAt: new Date()
                            }
                        });
                    }
                }
            }
        }

        await call.save();

        res.json({ 
            success: true, 
            call,
            message: "Call status updated successfully" 
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to update call status" });
    }
};

// Add participant to group call
export const addParticipant = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { callId, participantId } = req.body;

        const call = await Call.findOne({ call_id: callId });
        if (!call) {
            return res.json({ success: false, message: "Call not found" });
        }

        // Check if user is the initiator or existing participant
        const canAddParticipant = call.initiator === userId || call.participants.includes(userId);
        if (!canAddParticipant) {
            return res.json({ success: false, message: "Unauthorized to add participants" });
        }

        // Check if participant already in call
        if (call.participants.includes(participantId)) {
            return res.json({ success: false, message: "User is already in the call" });
        }

        // Add participant
        call.participants.push(participantId);
        call.is_group_call = true;
        await call.save();

        // Populate updated call data
        await call.populate('initiator participants');

        // Create notification for new participant
        const inviter = await User.findById(userId);
        if (inviter) {
            await createNotification({
                recipient: participantId,
                sender: userId,
                type: 'call',
                content: `${inviter.full_name} added you to a ${call.call_type} call`,
                metadata: { 
                    callId, 
                    callType: call.call_type,
                    isGroupCall: true 
                }
            });
        }

        res.json({ 
            success: true, 
            call,
            message: "Participant added successfully" 
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to add participant" });
    }
};

// Get call history
export const getCallHistory = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { page = 1, limit = 20 } = req.query;

        const calls = await Call.find({
            $or: [
                { initiator: userId },
                { participants: userId }
            ]
        })
        .populate('initiator participants', 'full_name username profile_picture')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

        const totalCalls = await Call.countDocuments({
            $or: [
                { initiator: userId },
                { participants: userId }
            ]
        });

        res.json({ 
            success: true, 
            calls,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalCalls / limit),
            totalCalls
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to get call history" });
    }
};

// Get active calls for user
export const getActiveCalls = async (req, res) => {
    try {
        const { userId } = req.auth();

        const activeCalls = await Call.find({
            $or: [
                { initiator: userId },
                { participants: userId }
            ],
            status: { $in: ['initiated', 'ringing', 'active'] }
        })
        .populate('initiator participants', 'full_name username profile_picture')
        .sort({ createdAt: -1 });

        res.json({ 
            success: true, 
            activeCalls
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to get active calls" });
    }
};
