import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/db.js';
import {inngest, functions} from './inngest/index.js'
import {serve} from 'inngest/express'
import { clerkMiddleware } from '@clerk/express'
import { createServer } from 'http';
import { Server } from 'socket.io';
import userRouter from './routes/userRotes.js';
import postRouter from './routes/postRoutes.js';
import storyRouter from './routes/storyRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import commentRouter from './routes/commentRoutes.js';
import notificationRouter from './routes/notificationRoutes.js';
import callRouter from './routes/callRoutes.js';
import groupRouter from './routes/groupRoutes.js';

const app = express();
const server = createServer(app);

// Configure Socket.io with CORS
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

await connectDB();

app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());

app.get('/', (req, res)=> res.send('Server is running'))
app.use('/api/inngest', serve({ client: inngest, functions }))
app.use('/api/user', userRouter)
app.use('/api/post', postRouter)
app.use('/api/story', storyRouter)
app.use('/api/message', messageRouter)
app.use('/api/comment', commentRouter)
app.use('/api/notification', notificationRouter)
app.use('/api/call', callRouter)
app.use('/api/group', groupRouter)

// Socket.io connection handling for calls
const connectedUsers = new Map(); // userId -> socketId
const activeCalls = new Map(); // callId -> { participants: [], status: '' }

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // User joins with their ID
    socket.on('user-connected', (userId) => {
        connectedUsers.set(userId, socket.id);
        socket.userId = userId;
        console.log(`User ${userId} connected with socket ${socket.id}`);
    });

    // Call initiation
    socket.on('initiate-call', (data) => {
        const { callId, recipientId, callType, initiatorData } = data;
        const recipientSocketId = connectedUsers.get(recipientId);

        if (recipientSocketId) {
            activeCalls.set(callId, {
                participants: [socket.userId, recipientId],
                status: 'ringing',
                callType,
                initiator: socket.userId
            });

            io.to(recipientSocketId).emit('incoming-call', {
                callId,
                callType,
                initiator: initiatorData
            });
        }
    });

    // Call response (accept/decline)
    socket.on('call-response', (data) => {
        const { callId, response, userData } = data;
        const call = activeCalls.get(callId);

        if (call) {
            const initiatorSocketId = connectedUsers.get(call.initiator);

            if (response === 'accept') {
                call.status = 'active';
                activeCalls.set(callId, call);

                if (initiatorSocketId) {
                    io.to(initiatorSocketId).emit('call-accepted', {
                        callId,
                        acceptedBy: userData
                    });
                }
            } else {
                activeCalls.delete(callId);

                if (initiatorSocketId) {
                    io.to(initiatorSocketId).emit('call-declined', {
                        callId,
                        declinedBy: userData
                    });
                }
            }
        }
    });

    // WebRTC signaling
    socket.on('webrtc-offer', (data) => {
        const { callId, offer, targetUserId } = data;
        const targetSocketId = connectedUsers.get(targetUserId);

        if (targetSocketId) {
            io.to(targetSocketId).emit('webrtc-offer', {
                callId,
                offer,
                fromUserId: socket.userId
            });
        }
    });

    socket.on('webrtc-answer', (data) => {
        const { callId, answer, targetUserId } = data;
        const targetSocketId = connectedUsers.get(targetUserId);

        if (targetSocketId) {
            io.to(targetSocketId).emit('webrtc-answer', {
                callId,
                answer,
                fromUserId: socket.userId
            });
        }
    });

    socket.on('webrtc-ice-candidate', (data) => {
        const { callId, candidate, targetUserId } = data;
        const targetSocketId = connectedUsers.get(targetUserId);

        if (targetSocketId) {
            io.to(targetSocketId).emit('webrtc-ice-candidate', {
                callId,
                candidate,
                fromUserId: socket.userId
            });
        }
    });

    // Group call - add participant
    socket.on('add-participant', (data) => {
        const { callId, participantId, participantData } = data;
        const call = activeCalls.get(callId);
        const participantSocketId = connectedUsers.get(participantId);

        if (call && participantSocketId && !call.participants.includes(participantId)) {
            call.participants.push(participantId);
            activeCalls.set(callId, call);

            // Notify new participant
            io.to(participantSocketId).emit('added-to-call', {
                callId,
                callType: call.callType,
                participants: call.participants,
                addedBy: socket.userId
            });

            // Notify existing participants
            call.participants.forEach(userId => {
                if (userId !== participantId) {
                    const socketId = connectedUsers.get(userId);
                    if (socketId) {
                        io.to(socketId).emit('participant-joined', {
                            callId,
                            newParticipant: participantData
                        });
                    }
                }
            });
        }
    });

    // End call
    socket.on('end-call', (data) => {
        const { callId } = data;
        const call = activeCalls.get(callId);

        if (call) {
            call.participants.forEach(userId => {
                if (userId !== socket.userId) {
                    const socketId = connectedUsers.get(userId);
                    if (socketId) {
                        io.to(socketId).emit('call-ended', {
                            callId,
                            endedBy: socket.userId
                        });
                    }
                }
            });

            activeCalls.delete(callId);
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        if (socket.userId) {
            connectedUsers.delete(socket.userId);

            // End any active calls this user was in
            for (const [callId, call] of activeCalls.entries()) {
                if (call.participants.includes(socket.userId)) {
                    call.participants.forEach(userId => {
                        if (userId !== socket.userId) {
                            const socketId = connectedUsers.get(userId);
                            if (socketId) {
                                io.to(socketId).emit('participant-disconnected', {
                                    callId,
                                    disconnectedUserId: socket.userId
                                });
                            }
                        }
                    });

                    // Remove user from call or end call if they were the last one
                    call.participants = call.participants.filter(id => id !== socket.userId);
                    if (call.participants.length === 0) {
                        activeCalls.delete(callId);
                    } else {
                        activeCalls.set(callId, call);
                    }
                }
            }
        }

        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, ()=> console.log(`Server is running on port ${PORT}`))
