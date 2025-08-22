import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import socketService from '../services/socketService';
import webrtcService from '../services/webrtcService';
import { 
    setCallStatus, 
    endCall, 
    updateMediaSettings,
    updateCallStatus 
} from '../features/calls/callsSlice';

const CallingScreen = () => {
    const dispatch = useDispatch();
    const { getToken } = useAuth();
    
    const { 
        currentCall, 
        callStatus,
        participants,
        mediaSettings,
        isCallInitiating 
    } = useSelector(state => state.calls);
    
    const currentUser = useSelector(state => state.user.value);
    
    const [callDuration, setCallDuration] = useState(0);
    const [ringtonePlaying, setRingtonePlaying] = useState(false);

    // Get the person being called (first participant who isn't current user)
    const callee = participants?.find(p => p._id !== currentUser?._id);

    useEffect(() => {
        let interval;
        
        if (callStatus === 'initiated' || callStatus === 'ringing') {
            // Start ringing sound
            setRingtonePlaying(true);
            
            // Start timer
            interval = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
            
            // Auto-end call after 30 seconds if no answer
            const timeout = setTimeout(() => {
                if (callStatus === 'initiated' || callStatus === 'ringing') {
                    handleEndCall('no_answer');
                }
            }, 30000);
            
            return () => {
                clearInterval(interval);
                clearTimeout(timeout);
                setRingtonePlaying(false);
            };
        } else {
            setRingtonePlaying(false);
        }
        
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [callStatus]);

    // Listen for call responses
    useEffect(() => {
        const handleCallAccepted = (data) => {
            if (data.callId === currentCall?.call_id) {
                dispatch(setCallStatus('active'));
                setRingtonePlaying(false);
                toast.success('Call connected');
            }
        };

        const handleCallDeclined = (data) => {
            if (data.callId === currentCall?.call_id) {
                dispatch(endCall());
                toast.error('Call declined');
            }
        };

        const handleCallEnded = (data) => {
            if (data.callId === currentCall?.call_id) {
                dispatch(endCall());
                toast.info('Call ended');
            }
        };

        socketService.onCallAccepted(handleCallAccepted);
        socketService.onCallDeclined(handleCallDeclined);
        socketService.onCallEnded(handleCallEnded);

        return () => {
            socketService.removeAllListeners();
        };
    }, [currentCall?.call_id, dispatch]);

    const handleEndCall = async (reason = 'ended') => {
        try {
            const token = await getToken();
            
            // Update call status in database
            await dispatch(updateCallStatus({
                callId: currentCall.call_id,
                status: reason === 'no_answer' ? 'missed' : 'ended',
                duration: callDuration,
                token
            }));
            
            // Notify other participants via socket
            socketService.endCall(currentCall.call_id);
            
            // Clean up
            webrtcService.closeAllConnections();
            dispatch(endCall());
            setRingtonePlaying(false);
            
            if (reason === 'no_answer') {
                toast.error('Call not answered');
            }
            
        } catch (error) {
            console.error('Error ending call:', error);
            dispatch(endCall());
            setRingtonePlaying(false);
        }
    };

    const toggleVideo = () => {
        const isEnabled = !mediaSettings.isVideoEnabled;
        dispatch(updateMediaSettings({ 
            isVideoEnabled: isEnabled,
            isCameraOn: isEnabled 
        }));
    };

    const toggleAudio = () => {
        const isEnabled = !mediaSettings.isAudioEnabled;
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

    // Don't show if call is already active (handled by CallInterface)
    if (!currentCall || callStatus === 'active' || callStatus === 'ended') {
        return null;
    }

    // Don't show if not initiating a call
    if (!isCallInitiating) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-black z-50 flex flex-col text-white">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)]"></div>
            </div>

            {/* Header */}
            <div className="relative z-10 text-center pt-16 pb-8">
                <p className="text-lg text-gray-300 mb-2">
                    {currentCall?.is_group_call ? 'Group Call' : 'Calling'}
                </p>
                <h1 className="text-2xl font-medium mb-4">
                    {currentCall?.is_group_call 
                        ? `${participants?.length || 0} participants`
                        : callee?.full_name || 'Unknown'
                    }
                </h1>
                <div className="flex items-center justify-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                        callStatus === 'initiated' ? 'bg-blue-500' : 
                        callStatus === 'ringing' ? 'bg-yellow-500' : 'bg-green-500'
                    } animate-pulse`}></div>
                    <p className="text-gray-400 capitalize">
                        {callStatus === 'initiated' ? 'Connecting...' : callStatus}
                    </p>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                    {formatDuration(callDuration)}
                </p>
            </div>

            {/* Profile Section */}
            <div className="relative z-10 flex-1 flex items-center justify-center">
                {currentCall?.is_group_call ? (
                    // Group call - show multiple avatars
                    <div className="flex items-center justify-center">
                        <div className="grid grid-cols-2 gap-4">
                            {participants?.slice(0, 4).map((participant, index) => (
                                <div 
                                    key={participant._id} 
                                    className={`relative ${
                                        participants.length === 1 ? 'col-span-2' : ''
                                    }`}
                                >
                                    <div className={`rounded-full overflow-hidden ring-4 ring-white ring-opacity-20 ${
                                        participants.length === 1 ? 'w-48 h-48' :
                                        participants.length <= 2 ? 'w-32 h-32' : 'w-24 h-24'
                                    }`}>
                                        <img 
                                            src={participant.profile_picture} 
                                            alt={participant.full_name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <p className="text-center text-sm mt-2 text-gray-300">
                                        {participant.full_name}
                                    </p>
                                </div>
                            ))}
                            {participants?.length > 4 && (
                                <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center ring-4 ring-white ring-opacity-20">
                                    <span className="text-white text-sm font-medium">
                                        +{participants.length - 4}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    // Single call - show large avatar
                    <div className="text-center">
                        <div className="relative mx-auto mb-6">
                            <div className="w-56 h-56 rounded-full overflow-hidden ring-8 ring-white ring-opacity-10 mx-auto">
                                <img 
                                    src={callee?.profile_picture} 
                                    alt={callee?.full_name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            
                            {/* Pulsing ring animation during ringing */}
                            {ringtonePlaying && (
                                <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping"></div>
                            )}
                        </div>
                        
                        <p className="text-xl font-medium text-gray-200">
                            {callee?.full_name || 'Unknown'}
                        </p>
                        <p className="text-gray-400 mt-1">
                            @{callee?.username || 'unknown'}
                        </p>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="relative z-10 p-8">
                <div className="flex items-center justify-center gap-8">
                    {/* Audio Toggle */}
                    <button
                        onClick={toggleAudio}
                        className={`p-4 rounded-full transition-all duration-300 ${
                            mediaSettings.isAudioEnabled 
                                ? 'bg-gray-700 bg-opacity-80 text-white hover:bg-gray-600' 
                                : 'bg-red-600 text-white hover:bg-red-700'
                        } backdrop-blur-sm`}
                    >
                        {mediaSettings.isAudioEnabled ? (
                            <Mic className="w-6 h-6" />
                        ) : (
                            <MicOff className="w-6 h-6" />
                        )}
                    </button>

                    {/* Video Toggle (only for video calls) */}
                    {currentCall?.call_type === 'video' && (
                        <button
                            onClick={toggleVideo}
                            className={`p-4 rounded-full transition-all duration-300 ${
                                mediaSettings.isVideoEnabled 
                                    ? 'bg-gray-700 bg-opacity-80 text-white hover:bg-gray-600' 
                                    : 'bg-red-600 text-white hover:bg-red-700'
                            } backdrop-blur-sm`}
                        >
                            {mediaSettings.isVideoEnabled ? (
                                <Video className="w-6 h-6" />
                            ) : (
                                <VideoOff className="w-6 h-6" />
                            )}
                        </button>
                    )}

                    {/* End Call */}
                    <button
                        onClick={() => handleEndCall()}
                        className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700 transition-all duration-300 backdrop-blur-sm shadow-lg"
                    >
                        <PhoneOff className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Call Type Indicator */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-30 px-3 py-1 rounded-full backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    {currentCall?.call_type === 'video' ? (
                        <Video className="w-4 h-4" />
                    ) : (
                        <Phone className="w-4 h-4" />
                    )}
                    <span className="text-sm capitalize">{currentCall?.call_type} Call</span>
                </div>
            </div>
        </div>
    );
};

export default CallingScreen;
