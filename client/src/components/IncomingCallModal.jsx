import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Phone, PhoneOff, Video, User } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import socketService from '../services/socketService';
import webrtcService from '../services/webrtcService';
import { 
    clearIncomingCall, 
    setCurrentCall, 
    setCallActive, 
    setCallStatus,
    setParticipants,
    updateCallStatus
} from '../features/calls/callsSlice';

const IncomingCallModal = () => {
    const dispatch = useDispatch();
    const { getToken } = useAuth();
    const { incomingCall } = useSelector(state => state.calls);
    const currentUser = useSelector(state => state.user.value);
    
    const [isRinging, setIsRinging] = useState(false);
    const audioRef = React.useRef(null);

    useEffect(() => {
        if (incomingCall) {
            setIsRinging(true);
            // Play ringtone (you can add an audio file)
            // if (audioRef.current) {
            //     audioRef.current.play();
            // }
        } else {
            setIsRinging(false);
            // Stop ringtone
            // if (audioRef.current) {
            //     audioRef.current.pause();
            //     audioRef.current.currentTime = 0;
            // }
        }
    }, [incomingCall]);

    const handleAcceptCall = async () => {
        try {
            const token = await getToken();
            
            // Respond to call via socket
            socketService.respondToCall({
                callId: incomingCall.callId,
                response: 'accept',
                userData: currentUser
            });
            
            // Create call object
            const callData = {
                call_id: incomingCall.callId,
                call_type: incomingCall.callType,
                initiator: incomingCall.initiator._id,
                participants: [incomingCall.initiator, currentUser],
                status: 'active',
                is_group_call: false
            };
            
            // Update Redux state
            dispatch(setCurrentCall(callData));
            dispatch(setParticipants([incomingCall.initiator, currentUser]));
            dispatch(setCallActive(true));
            dispatch(setCallStatus('active'));
            dispatch(clearIncomingCall());
            
            // Update call status in database
            await dispatch(updateCallStatus({
                callId: incomingCall.callId,
                status: 'active',
                token
            }));
            
            toast.success('Call accepted');
            
        } catch (error) {
            console.error('Error accepting call:', error);
            toast.error('Failed to accept call');
        }
    };

    const handleDeclineCall = async () => {
        try {
            const token = await getToken();
            
            // Respond to call via socket
            socketService.respondToCall({
                callId: incomingCall.callId,
                response: 'decline',
                userData: currentUser
            });
            
            // Update call status in database
            await dispatch(updateCallStatus({
                callId: incomingCall.callId,
                status: 'declined',
                token
            }));
            
            dispatch(clearIncomingCall());
            toast.info('Call declined');
            
        } catch (error) {
            console.error('Error declining call:', error);
            dispatch(clearIncomingCall());
        }
    };

    if (!incomingCall) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
            {/* Ringtone audio (uncomment and add audio file) */}
            {/* <audio ref={audioRef} loop>
                <source src="/ringtone.mp3" type="audio/mpeg" />
            </audio> */}
            
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center">
                {/* Caller Info */}
                <div className="mb-8">
                    <div className={`w-32 h-32 rounded-full overflow-hidden mx-auto mb-4 ring-4 ${isRinging ? 'ring-blue-500 animate-pulse' : 'ring-gray-300'}`}>
                        {incomingCall.initiator.profile_picture ? (
                            <img 
                                src={incomingCall.initiator.profile_picture} 
                                alt={incomingCall.initiator.full_name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                                <User className="w-16 h-16 text-gray-600" />
                            </div>
                        )}
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {incomingCall.initiator.full_name}
                    </h3>
                    
                    <div className="flex items-center justify-center gap-2 text-gray-600 mb-2">
                        {incomingCall.callType === 'video' ? (
                            <Video className="w-5 h-5" />
                        ) : (
                            <Phone className="w-5 h-5" />
                        )}
                        <span>
                            Incoming {incomingCall.callType} call
                        </span>
                    </div>
                    
                    <p className="text-sm text-gray-500">
                        @{incomingCall.initiator.username}
                    </p>
                </div>

                {/* Call Actions */}
                <div className="flex justify-center gap-8">
                    {/* Decline Button */}
                    <button
                        onClick={handleDeclineCall}
                        className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all transform hover:scale-105 active:scale-95"
                    >
                        <PhoneOff className="w-8 h-8" />
                    </button>

                    {/* Accept Button */}
                    <button
                        onClick={handleAcceptCall}
                        className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-all transform hover:scale-105 active:scale-95 animate-pulse"
                    >
                        {incomingCall.callType === 'video' ? (
                            <Video className="w-8 h-8" />
                        ) : (
                            <Phone className="w-8 h-8" />
                        )}
                    </button>
                </div>

                {/* Call Type Badge */}
                <div className="mt-6">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                        incomingCall.callType === 'video' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                    }`}>
                        {incomingCall.callType === 'video' ? (
                            <Video className="w-4 h-4" />
                        ) : (
                            <Phone className="w-4 h-4" />
                        )}
                        {incomingCall.callType === 'video' ? 'Video Call' : 'Voice Call'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default IncomingCallModal;
