import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
    Phone, 
    PhoneOff, 
    Video, 
    VideoOff, 
    Mic, 
    MicOff, 
    UserPlus,
    Users,
    Settings,
    Minimize2,
    Maximize2
} from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import socketService from '../services/socketService';
import webrtcService from '../services/webrtcService';
import { 
    endCall, 
    updateMediaSettings, 
    setCallStatus,
    addRemoteStream,
    removeRemoteStream,
    addParticipant,
    removeParticipant,
    updateCallStatus
} from '../features/calls/callsSlice';
import AddParticipantModal from './AddParticipantModal';

const CallInterface = () => {
    const dispatch = useDispatch();
    const { getToken } = useAuth();
    const localVideoRef = useRef(null);
    const remoteVideosRef = useRef({});
    
    const { 
        currentCall, 
        isCallActive, 
        callStatus,
        participants,
        mediaSettings,
        remoteStreams
    } = useSelector(state => state.calls);
    
    const currentUser = useSelector(state => state.user.value);
    
    const [callDuration, setCallDuration] = useState(0);
    const [isMinimized, setIsMinimized] = useState(false);
    const [showAddParticipant, setShowAddParticipant] = useState(false);
    const [callStartTime, setCallStartTime] = useState(null);

    // Timer for call duration
    useEffect(() => {
        let interval;
        if (callStatus === 'active' && !callStartTime) {
            setCallStartTime(Date.now());
        }
        
        if (callStatus === 'active' && callStartTime) {
            interval = setInterval(() => {
                setCallDuration(Math.floor((Date.now() - callStartTime) / 1000));
            }, 1000);
        }
        
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [callStatus, callStartTime]);

    // Setup local video stream
    useEffect(() => {
        if (isCallActive && currentCall) {
            setupLocalStream();
        }
        
        return () => {
            if (!isCallActive) {
                webrtcService.closeAllConnections();
            }
        };
    }, [isCallActive, currentCall]);

    // Setup remote streams
    useEffect(() => {
        Object.entries(remoteStreams).forEach(([userId, stream]) => {
            if (remoteVideosRef.current[userId] && stream) {
                remoteVideosRef.current[userId].srcObject = stream;
            }
        });
    }, [remoteStreams]);

    const setupLocalStream = async () => {
        try {
            const isVideo = currentCall?.call_type === 'video';
            const stream = await webrtcService.getUserMedia(isVideo);
            
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            
            // Setup WebRTC connections for each participant
            participants.forEach(participant => {
                if (participant._id !== currentUser._id) {
                    setupPeerConnection(participant._id);
                }
            });
            
        } catch (error) {
            console.error('Error setting up local stream:', error);
            toast.error('Failed to access camera/microphone');
        }
    };

    const setupPeerConnection = (userId) => {
        const callbacks = {
            callId: currentCall.call_id,
            onRemoteStream: (userId, stream) => {
                dispatch(addRemoteStream({ userId, stream }));
            },
            onConnectionStateChange: (userId, state) => {
                console.log(`Connection with ${userId}: ${state}`);
                if (state === 'disconnected' || state === 'failed') {
                    dispatch(removeRemoteStream(userId));
                }
            }
        };
        
        webrtcService.createPeerConnection(userId, socketService, callbacks);
    };

    const handleEndCall = async () => {
        try {
            const token = await getToken();
            const duration = callDuration;
            
            // Update call status in database
            await dispatch(updateCallStatus({
                callId: currentCall.call_id,
                status: 'ended',
                duration,
                token
            }));
            
            // Notify other participants via socket
            socketService.endCall(currentCall.call_id);
            
            // Clean up local resources
            webrtcService.closeAllConnections();
            dispatch(endCall());
            
            toast.success(`Call ended. Duration: ${formatDuration(duration)}`);
            
        } catch (error) {
            console.error('Error ending call:', error);
            toast.error('Failed to end call properly');
            dispatch(endCall()); // Force end call locally
        }
    };

    const toggleVideo = () => {
        const isEnabled = webrtcService.toggleVideo();
        dispatch(updateMediaSettings({ 
            isVideoEnabled: isEnabled,
            isCameraOn: isEnabled 
        }));
    };

    const toggleAudio = () => {
        const isEnabled = webrtcService.toggleAudio();
        dispatch(updateMediaSettings({ 
            isAudioEnabled: isEnabled,
            isMicOn: isEnabled 
        }));
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAddParticipant = () => {
        setShowAddParticipant(true);
    };

    if (!isCallActive || !currentCall) {
        return null;
    }

    return (
        <div className={`fixed inset-0 bg-gray-900 z-50 flex flex-col ${isMinimized ? 'bottom-0 right-0 w-80 h-60' : ''}`}>
            {/* Header */}
            <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${callStatus === 'active' ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></div>
                    <div>
                        <h3 className="font-medium">
                            {currentCall.is_group_call ? 'Group Call' : participants[0]?.full_name || 'Unknown'}
                        </h3>
                        <p className="text-sm text-gray-300">
                            {callStatus === 'active' ? formatDuration(callDuration) : callStatus}
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    {currentCall.is_group_call && (
                        <span className="text-sm bg-gray-700 px-2 py-1 rounded">
                            {participants.length} participants
                        </span>
                    )}
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="p-2 text-gray-300 hover:text-white transition-colors"
                    >
                        {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Video Grid */}
            <div className="flex-1 relative bg-black">
                {currentCall.call_type === 'video' ? (
                    <div className={`grid gap-2 p-4 h-full ${
                        participants.length <= 2 ? 'grid-cols-1' :
                        participants.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'
                    }`}>
                        {/* Local Video */}
                        <div className="relative bg-gray-800 rounded-lg overflow-hidden">
                            <video
                                ref={localVideoRef}
                                autoPlay
                                muted
                                playsInline
                                className={`w-full h-full object-cover ${!mediaSettings.isVideoEnabled ? 'hidden' : ''}`}
                            />
                            {!mediaSettings.isVideoEnabled && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                                    <div className="text-center text-white">
                                        <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <span className="text-xl font-medium">
                                                {currentUser?.full_name?.charAt(0)}
                                            </span>
                                        </div>
                                        <p className="text-sm">You</p>
                                    </div>
                                </div>
                            )}
                            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                                You
                            </div>
                        </div>

                        {/* Remote Videos */}
                        {participants.filter(p => p._id !== currentUser._id).map(participant => (
                            <div key={participant._id} className="relative bg-gray-800 rounded-lg overflow-hidden">
                                <video
                                    ref={el => remoteVideosRef.current[participant._id] = el}
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                                    {participant.full_name}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    // Voice Call - Show profile pictures
                    <div className="flex flex-col items-center justify-center h-full text-white">
                        <div className="flex items-center justify-center gap-8 mb-8">
                            {participants.map(participant => (
                                <div key={participant._id} className="text-center">
                                    <div className="w-24 h-24 rounded-full overflow-hidden mb-3 ring-4 ring-white ring-opacity-30">
                                        <img 
                                            src={participant.profile_picture} 
                                            alt={participant.full_name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <p className="text-sm font-medium">{participant.full_name}</p>
                                </div>
                            ))}
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-medium mb-2">Voice Call</h3>
                            <p className="text-gray-300">{formatDuration(callDuration)}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="bg-gray-800 p-4">
                <div className="flex items-center justify-center gap-4">
                    {/* Audio Toggle */}
                    <button
                        onClick={toggleAudio}
                        className={`p-3 rounded-full transition-all ${
                            mediaSettings.isAudioEnabled 
                                ? 'bg-gray-700 text-white hover:bg-gray-600' 
                                : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                    >
                        {mediaSettings.isAudioEnabled ? (
                            <Mic className="w-5 h-5" />
                        ) : (
                            <MicOff className="w-5 h-5" />
                        )}
                    </button>

                    {/* Video Toggle (only for video calls) */}
                    {currentCall.call_type === 'video' && (
                        <button
                            onClick={toggleVideo}
                            className={`p-3 rounded-full transition-all ${
                                mediaSettings.isVideoEnabled 
                                    ? 'bg-gray-700 text-white hover:bg-gray-600' 
                                    : 'bg-red-600 text-white hover:bg-red-700'
                            }`}
                        >
                            {mediaSettings.isVideoEnabled ? (
                                <Video className="w-5 h-5" />
                            ) : (
                                <VideoOff className="w-5 h-5" />
                            )}
                        </button>
                    )}

                    {/* Add Participant (for group calls or to convert to group) */}
                    <button
                        onClick={handleAddParticipant}
                        className="p-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all"
                        title="Add Participant"
                    >
                        <UserPlus className="w-5 h-5" />
                    </button>

                    {/* End Call */}
                    <button
                        onClick={handleEndCall}
                        className="p-3 rounded-full bg-red-600 text-white hover:bg-red-700 transition-all"
                    >
                        <PhoneOff className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Add Participant Modal */}
            {showAddParticipant && (
                <AddParticipantModal 
                    callId={currentCall.call_id}
                    onClose={() => setShowAddParticipant(false)}
                />
            )}
        </div>
    );
};

export default CallInterface;
