class WebRTCService {
    constructor() {
        this.localStream = null;
        this.peerConnections = new Map(); // userId -> RTCPeerConnection
        this.isVideoEnabled = true;
        this.isAudioEnabled = true;
        
        // ICE servers configuration
        this.iceServers = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
            ]
        };
    }

    // Get user media (camera/microphone)
    async getUserMedia(isVideo = true) {
        try {
            const constraints = {
                audio: true,
                video: isVideo ? {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                } : false
            };

            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            this.isVideoEnabled = isVideo;
            this.isAudioEnabled = true;
            
            return this.localStream;
        } catch (error) {
            console.error('Error accessing media devices:', error);
            throw error;
        }
    }

    // Create peer connection
    createPeerConnection(userId, socketService, callbacks = {}) {
        try {
            const peerConnection = new RTCPeerConnection(this.iceServers);
            
            // Add local stream tracks
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => {
                    peerConnection.addTrack(track, this.localStream);
                });
            }

            // Handle remote stream
            peerConnection.ontrack = (event) => {
                console.log('Received remote stream from:', userId);
                if (callbacks.onRemoteStream) {
                    callbacks.onRemoteStream(userId, event.streams[0]);
                }
            };

            // Handle ICE candidates
            peerConnection.onicecandidate = (event) => {
                if (event.candidate && socketService) {
                    socketService.sendIceCandidate({
                        callId: callbacks.callId,
                        candidate: event.candidate,
                        targetUserId: userId
                    });
                }
            };

            // Handle connection state changes
            peerConnection.onconnectionstatechange = () => {
                console.log(`Connection state with ${userId}:`, peerConnection.connectionState);
                if (callbacks.onConnectionStateChange) {
                    callbacks.onConnectionStateChange(userId, peerConnection.connectionState);
                }
            };

            this.peerConnections.set(userId, peerConnection);
            return peerConnection;
        } catch (error) {
            console.error('Error creating peer connection:', error);
            throw error;
        }
    }

    // Create and send offer
    async createOffer(userId, socketService, callId) {
        try {
            const peerConnection = this.peerConnections.get(userId);
            if (!peerConnection) {
                throw new Error('Peer connection not found');
            }

            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            socketService.sendOffer({
                callId,
                offer,
                targetUserId: userId
            });

            return offer;
        } catch (error) {
            console.error('Error creating offer:', error);
            throw error;
        }
    }

    // Handle received offer
    async handleOffer(userId, offer, socketService, callId) {
        try {
            const peerConnection = this.peerConnections.get(userId);
            if (!peerConnection) {
                throw new Error('Peer connection not found');
            }

            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            socketService.sendAnswer({
                callId,
                answer,
                targetUserId: userId
            });

            return answer;
        } catch (error) {
            console.error('Error handling offer:', error);
            throw error;
        }
    }

    // Handle received answer
    async handleAnswer(userId, answer) {
        try {
            const peerConnection = this.peerConnections.get(userId);
            if (!peerConnection) {
                throw new Error('Peer connection not found');
            }

            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (error) {
            console.error('Error handling answer:', error);
            throw error;
        }
    }

    // Handle ICE candidate
    async handleIceCandidate(userId, candidate) {
        try {
            const peerConnection = this.peerConnections.get(userId);
            if (!peerConnection) {
                console.warn('Peer connection not found for ICE candidate');
                return;
            }

            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
            console.error('Error handling ICE candidate:', error);
        }
    }

    // Toggle video
    toggleVideo() {
        if (this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                this.isVideoEnabled = videoTrack.enabled;
                return this.isVideoEnabled;
            }
        }
        return false;
    }

    // Toggle audio
    toggleAudio() {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                this.isAudioEnabled = audioTrack.enabled;
                return this.isAudioEnabled;
            }
        }
        return false;
    }

    // Get connection statistics
    async getConnectionStats(userId) {
        const peerConnection = this.peerConnections.get(userId);
        if (!peerConnection) return null;

        try {
            const stats = await peerConnection.getStats();
            return stats;
        } catch (error) {
            console.error('Error getting connection stats:', error);
            return null;
        }
    }

    // Close peer connection
    closePeerConnection(userId) {
        const peerConnection = this.peerConnections.get(userId);
        if (peerConnection) {
            peerConnection.close();
            this.peerConnections.delete(userId);
        }
    }

    // Stop local stream
    stopLocalStream() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                track.stop();
            });
            this.localStream = null;
        }
    }

    // Close all connections
    closeAllConnections() {
        this.peerConnections.forEach((peerConnection, userId) => {
            peerConnection.close();
        });
        this.peerConnections.clear();
        this.stopLocalStream();
    }

    // Check if browser supports WebRTC
    static isSupported() {
        return !!(navigator.mediaDevices && 
                 navigator.mediaDevices.getUserMedia && 
                 window.RTCPeerConnection);
    }
}

const webrtcService = new WebRTCService();
export default webrtcService;
