import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Phone, PhoneOff, Video, VideoOff, MessageSquare, User } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import socketService from '../services/socketService';
import webrtcService from '../services/webrtcService';
import {
    setCallActive,
    setCallStatus,
    clearIncomingCall,
    endCall,
    updateCallStatus,
    setCurrentCall,
    setParticipants
} from '../features/calls/callsSlice';

const IncomingCallScreen = () => {
    const dispatch = useDispatch();
    const { getToken } = useAuth();
    const ringtoneRef = useRef(null);
    
    const { incomingCall } = useSelector(state => state.calls);
    const currentUser = useSelector(state => state.user.value);
    
    const [callDuration, setCallDuration] = useState(0);
    const [isRinging, setIsRinging] = useState(false);

    // Get caller info
    const caller = incomingCall?.initiator;
    const isVideoCall = incomingCall?.call_type === 'video';
    const isGroupCall = incomingCall?.is_group_call;

    useEffect(() => {
        if (incomingCall) {
            setIsRinging(true);
            
            // Start call duration timer
            const interval = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
            
            // Auto-decline after 30 seconds
            const timeout = setTimeout(() => {
                handleDecline('no_answer');
            }, 30000);
            
            // Play ringtone (you can add actual audio file)
            if ('vibrate' in navigator) {
                navigator.vibrate([500, 300, 500, 300, 500]);
            }
            
            return () => {
                clearInterval(interval);
                clearTimeout(timeout);
                setIsRinging(false);
            };
        }
    }, [incomingCall]);

    const handleAccept = async () => {
        try {
            const token = await getToken();
            
            // Set up local media stream
            const stream = await webrtcService.getUserMedia(isVideoCall);
            
            // Accept the call via socket
            socketService.respondToCall({
                callId: incomingCall.call_id,
                response: 'accepted',
                userId: currentUser._id
            });
            
            // Update call status
            await dispatch(updateCallStatus({
                callId: incomingCall.call_id,
                status: 'active',
                token
            }));
            
            // Set current call and participants
            dispatch(setCurrentCall(incomingCall));
            dispatch(setParticipants(incomingCall.participants));
            dispatch(setCallActive(true));
            dispatch(setCallStatus('active'));
            dispatch(clearIncomingCall());
            
            setIsRinging(false);
            toast.success('Call accepted');
            
        } catch (error) {
            console.error('Error accepting call:', error);
            toast.error('Failed to accept call');
            handleDecline();
        }
    };

    const handleDecline = async (reason = 'declined') => {
        try {
            const token = await getToken();
            
            // Decline the call via socket
            socketService.respondToCall({
                callId: incomingCall.call_id,
                response: 'declined',
                userId: currentUser._id
            });
            
            // Update call status
            await dispatch(updateCallStatus({
                callId: incomingCall.call_id,
                status: reason === 'no_answer' ? 'missed' : 'declined',
                duration: callDuration,
                token
            }));
            
            // Create missed call notification if no answer
            if (reason === 'no_answer') {
                // This will be handled by the server-side missed call notification creation
                toast.info('Missed call');
            }
            
            dispatch(clearIncomingCall());
            setIsRinging(false);
            
        } catch (error) {
            console.error('Error declining call:', error);
            dispatch(clearIncomingCall());
            setIsRinging(false);
        }
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (!incomingCall) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-gradient-to-b from-blue-900 via-blue-800 to-indigo-900 z-50 flex flex-col text-white">
            {/* Background Animation */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.2),transparent_50%)]"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(139,92,246,0.1),transparent_50%)]"></div>
                {isRinging && (
                    <div className="absolute inset-0 bg-blue-500 opacity-5 animate-pulse"></div>
                )}
            </div>

            {/* Header */}
            <div className="relative z-10 text-center pt-16 pb-8">
                <p className="text-lg text-blue-200 mb-2">
                    {isGroupCall ? 'Group' : 'Incoming'} {isVideoCall ? 'Video' : 'Voice'} Call
                </p>
                <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                    <p className="text-blue-300">
                        Ringing • {formatDuration(callDuration)}
                    </p>
                </div>
            </div>

            {/* Caller Profile */}
            <div className="relative z-10 flex-1 flex items-center justify-center">
                <div className="text-center">
                    {/* Profile Picture with Pulsing Effect */}
                    <div className="relative mx-auto mb-8">
                        <div className="w-64 h-64 rounded-full overflow-hidden ring-8 ring-white ring-opacity-20 mx-auto relative">
                            <img 
                                src={caller?.profile_picture} 
                                alt={caller?.full_name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        
                        {/* Animated rings */}
                        {isRinging && (
                            <>
                                <div className="absolute inset-0 rounded-full border-4 border-blue-300 animate-ping" style={{ animationDuration: '2s' }}></div>
                                <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }}></div>
                                <div className="absolute inset-0 rounded-full border-4 border-blue-500 animate-ping" style={{ animationDuration: '2s', animationDelay: '1s' }}></div>
                            </>
                        )}
                    </div>
                    
                    {/* Caller Info */}
                    <h1 className="text-3xl font-bold text-white mb-2">
                        {caller?.full_name || 'Unknown Caller'}
                    </h1>
                    <p className="text-blue-200 text-lg mb-1">
                        @{caller?.username || 'unknown'}
                    </p>
                    
                    {/* Group Call Info */}
                    {isGroupCall && (
                        <div className="mt-4 flex items-center justify-center gap-2">
                            <User className="w-5 h-5 text-blue-300" />
                            <span className="text-blue-300">
                                {incomingCall.participants?.length || 0} participants
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="relative z-10 p-8">
                <div className="flex items-center justify-center gap-12">
                    {/* Quick Message (optional) */}
                    <button className="p-4 rounded-full bg-gray-700 bg-opacity-60 text-white hover:bg-gray-600 transition-all duration-300 backdrop-blur-sm">
                        <MessageSquare className="w-6 h-6" />
                    </button>
                    
                    {/* Decline Button */}
                    <button
                        onClick={() => handleDecline()}
                        className="w-20 h-20 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all duration-300 shadow-2xl relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-red-600 transform scale-0 group-hover:scale-100 transition-transform duration-300 rounded-full"></div>
                        <PhoneOff className="w-8 h-8 relative z-10" />
                    </button>
                    
                    {/* Accept Button */}
                    <button
                        onClick={handleAccept}
                        className="w-20 h-20 rounded-full bg-green-500 text-white hover:bg-green-600 transition-all duration-300 shadow-2xl relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-green-600 transform scale-0 group-hover:scale-100 transition-transform duration-300 rounded-full"></div>
                        {isVideoCall ? (
                            <Video className="w-8 h-8 relative z-10" />
                        ) : (
                            <Phone className="w-8 h-8 relative z-10" />
                        )}
                    </button>
                    
                    {/* Quick Actions (Video Call Only) */}
                    {isVideoCall && (
                        <button className="p-4 rounded-full bg-gray-700 bg-opacity-60 text-white hover:bg-gray-600 transition-all duration-300 backdrop-blur-sm">
                            <VideoOff className="w-6 h-6" />
                        </button>
                    )}
                </div>
                
                {/* Action Labels */}
                <div className="flex items-center justify-center gap-12 mt-4">
                    <span className="text-xs text-blue-200 w-16 text-center">Message</span>
                    <span className="text-xs text-red-200 w-20 text-center">Decline</span>
                    <span className="text-xs text-green-200 w-20 text-center">
                        {isVideoCall ? 'Video' : 'Accept'}
                    </span>
                    {isVideoCall && (
                        <span className="text-xs text-blue-200 w-16 text-center">Voice Only</span>
                    )}
                </div>
            </div>

            {/* Slide to Answer Alternative (Mobile-style) */}
            <div className="absolute bottom-4 left-4 right-4 z-10">
                <div className="bg-black bg-opacity-30 rounded-full p-2 backdrop-blur-sm">
                    <div className="text-center text-sm text-blue-200">
                        Swipe up to answer • Swipe down to decline
                    </div>
                </div>
            </div>

            {/* Call Type Indicator */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-30 px-3 py-1 rounded-full backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    {isVideoCall ? (
                        <Video className="w-4 h-4" />
                    ) : (
                        <Phone className="w-4 h-4" />
                    )}
                    <span className="text-sm">
                        {isGroupCall ? 'Group ' : ''}{isVideoCall ? 'Video' : 'Voice'} Call
                    </span>
                </div>
            </div>
        </div>
    );
};

export default IncomingCallScreen;
