import { io } from 'socket.io-client';

class SocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
    }

    connect(userId) {
        if (!this.socket) {
            this.socket = io(import.meta.env.VITE_BASEURL || 'http://localhost:4000', {
                autoConnect: true,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });

            this.socket.on('connect', () => {
                console.log('Connected to server');
                this.isConnected = true;
                if (userId) {
                    this.socket.emit('user-connected', userId);
                }
            });

            this.socket.on('disconnect', () => {
                console.log('Disconnected from server');
                this.isConnected = false;
            });

            this.socket.on('connect_error', (error) => {
                console.error('Connection error:', error);
            });
        }
        
        if (userId && this.isConnected) {
            this.socket.emit('user-connected', userId);
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    // Call management
    initiateCall(callData) {
        if (this.socket) {
            this.socket.emit('initiate-call', callData);
        }
    }

    respondToCall(response) {
        if (this.socket) {
            this.socket.emit('call-response', response);
        }
    }

    endCall(callId) {
        if (this.socket) {
            this.socket.emit('end-call', { callId });
        }
    }

    addParticipant(data) {
        if (this.socket) {
            this.socket.emit('add-participant', data);
        }
    }

    // WebRTC signaling
    sendOffer(data) {
        if (this.socket) {
            this.socket.emit('webrtc-offer', data);
        }
    }

    sendAnswer(data) {
        if (this.socket) {
            this.socket.emit('webrtc-answer', data);
        }
    }

    sendIceCandidate(data) {
        if (this.socket) {
            this.socket.emit('webrtc-ice-candidate', data);
        }
    }

    // Event listeners
    onIncomingCall(callback) {
        if (this.socket) {
            this.socket.on('incoming-call', callback);
        }
    }

    onCallAccepted(callback) {
        if (this.socket) {
            this.socket.on('call-accepted', callback);
        }
    }

    onCallDeclined(callback) {
        if (this.socket) {
            this.socket.on('call-declined', callback);
        }
    }

    onCallEnded(callback) {
        if (this.socket) {
            this.socket.on('call-ended', callback);
        }
    }

    onWebRTCOffer(callback) {
        if (this.socket) {
            this.socket.on('webrtc-offer', callback);
        }
    }

    onWebRTCAnswer(callback) {
        if (this.socket) {
            this.socket.on('webrtc-answer', callback);
        }
    }

    onWebRTCIceCandidate(callback) {
        if (this.socket) {
            this.socket.on('webrtc-ice-candidate', callback);
        }
    }

    onParticipantJoined(callback) {
        if (this.socket) {
            this.socket.on('participant-joined', callback);
        }
    }

    onParticipantDisconnected(callback) {
        if (this.socket) {
            this.socket.on('participant-disconnected', callback);
        }
    }

    onAddedToCall(callback) {
        if (this.socket) {
            this.socket.on('added-to-call', callback);
        }
    }

    // Remove event listeners
    removeAllListeners() {
        if (this.socket) {
            this.socket.removeAllListeners();
        }
    }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService;
