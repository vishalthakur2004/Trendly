import Call from "../models/Call.js";
import User from "../models/User.js";
import Group from "../models/Group.js";
import { createNotification, generateNotificationContent } from "./notificationController.js";

// Initiate a call
export const initiateCall = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { recipientId, callType, isGroupCall = false } = req.body;

        if (!recipientId || !callType) {
            return res.json({ success: false, message: "Recipient ID and call type are required" });
        }

        // Check if recipient exists
        const recipient = await User.findById(recipientId);
        if (!recipient) {
            return res.json({ success: false, message: "Recipient not found" });
        }

        // Generate unique call ID
        const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Create call record
        const call = await Call.create({
            call_id: callId,
            initiator: userId,
            participants: [recipientId],
            call_type: callType,
            is_group_call: isGroupCall,
            status: 'initiated'
        });

        // Populate call data
        await call.populate('initiator participants');

        // Create notification for recipient
        const initiator = await User.findById(userId);
        if (initiator) {
            await createNotification({
                recipient: recipientId,
                sender: userId,
                type: 'call',
                content: `${initiator.full_name} is calling you`,
                metadata: { 
                    callId, 
                    callType,
                    isGroupCall 
                }
            });
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

        if (status === 'ended') {
            call.ended_at = new Date();
            if (duration) {
                call.duration = duration;
            } else if (call.started_at) {
                call.duration = Math.floor((Date.now() - call.started_at.getTime()) / 1000);
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
