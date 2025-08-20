import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '@clerk/clerk-react';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, Clock, Calendar, Users } from 'lucide-react';
import moment from 'moment';
import { fetchCallHistory } from '../features/calls/callsSlice';
import Loading from '../components/Loading';

const CallHistory = () => {
    const dispatch = useDispatch();
    const { getToken } = useAuth();
    const { callHistory, loading } = useSelector(state => state.calls);
    const currentUser = useSelector(state => state.user.value);
    
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const loadCallHistory = async () => {
            try {
                const token = await getToken();
                dispatch(fetchCallHistory({ page: currentPage, limit: 20, token }));
            } catch (error) {
                console.error('Error loading call history:', error);
            }
        };

        if (currentUser) {
            loadCallHistory();
        }
    }, [dispatch, getToken, currentUser, currentPage]);

    const getCallIcon = (call) => {
        if (call.call_type === 'video') {
            return <Video className="w-5 h-5" />;
        }
        return <Phone className="w-5 h-5" />;
    };

    const getCallDirection = (call) => {
        const isInitiator = call.initiator._id === currentUser._id;
        
        if (call.status === 'missed') {
            return { icon: <PhoneMissed className="w-4 h-4" />, text: 'Missed', color: 'text-red-500' };
        } else if (isInitiator) {
            return { icon: <PhoneOutgoing className="w-4 h-4" />, text: 'Outgoing', color: 'text-green-500' };
        } else {
            return { icon: <PhoneIncoming className="w-4 h-4" />, text: 'Incoming', color: 'text-blue-500' };
        }
    };

    const getCallParticipants = (call) => {
        if (call.is_group_call) {
            return {
                name: 'Group Call',
                avatar: null,
                participantCount: call.participants.length
            };
        } else {
            // Find the other participant (not current user)
            const otherParticipant = call.participants.find(p => p._id !== currentUser._id) || call.initiator;
            return {
                name: otherParticipant.full_name,
                avatar: otherParticipant.profile_picture,
                username: otherParticipant.username
            };
        }
    };

    const formatDuration = (seconds) => {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const filteredCalls = callHistory.filter(call => {
        if (selectedFilter === 'all') return true;
        if (selectedFilter === 'video') return call.call_type === 'video';
        if (selectedFilter === 'voice') return call.call_type === 'voice';
        if (selectedFilter === 'missed') return call.status === 'missed';
        if (selectedFilter === 'group') return call.is_group_call;
        return true;
    });

    if (loading && currentPage === 1) {
        return <Loading />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto p-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Call History</h1>
                    <p className="text-gray-600">View your recent calls and call details</p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                    <div className="flex flex-wrap gap-2">
                        {[
                            { key: 'all', label: 'All Calls', icon: <Phone className="w-4 h-4" /> },
                            { key: 'voice', label: 'Voice', icon: <Phone className="w-4 h-4" /> },
                            { key: 'video', label: 'Video', icon: <Video className="w-4 h-4" /> },
                            { key: 'missed', label: 'Missed', icon: <PhoneMissed className="w-4 h-4" /> },
                            { key: 'group', label: 'Group', icon: <Users className="w-4 h-4" /> }
                        ].map(filter => (
                            <button
                                key={filter.key}
                                onClick={() => setSelectedFilter(filter.key)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    selectedFilter === filter.key
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {filter.icon}
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Call History List */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {filteredCalls.length === 0 ? (
                        <div className="text-center py-12">
                            <Phone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No calls found</h3>
                            <p className="text-gray-500">
                                {selectedFilter === 'all' 
                                    ? "You haven't made or received any calls yet."
                                    : `No ${selectedFilter} calls found.`
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {filteredCalls.map((call) => {
                                const participants = getCallParticipants(call);
                                const direction = getCallDirection(call);
                                
                                return (
                                    <div key={call._id} className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            {/* Call Type Icon */}
                                            <div className={`p-2 rounded-full ${
                                                call.call_type === 'video' 
                                                    ? 'bg-blue-100 text-blue-600' 
                                                    : 'bg-green-100 text-green-600'
                                            }`}>
                                                {getCallIcon(call)}
                                            </div>

                                            {/* Participant Info */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {call.is_group_call ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                                                <Users className="w-4 h-4 text-gray-600" />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-medium text-gray-900">
                                                                    Group Call ({participants.participantCount} participants)
                                                                </h3>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <img 
                                                                src={participants.avatar} 
                                                                alt={participants.name}
                                                                className="w-8 h-8 rounded-full object-cover"
                                                            />
                                                            <div>
                                                                <h3 className="font-medium text-gray-900">{participants.name}</h3>
                                                                <p className="text-sm text-gray-500">@{participants.username}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                                    <div className={`flex items-center gap-1 ${direction.color}`}>
                                                        {direction.icon}
                                                        <span>{direction.text}</span>
                                                    </div>
                                                    
                                                    {call.duration > 0 && (
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="w-4 h-4" />
                                                            <span>{formatDuration(call.duration)}</span>
                                                        </div>
                                                    )}
                                                    
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        <span>{moment(call.createdAt).format('MMM D, h:mm A')}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Call Status */}
                                            <div className="text-right">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    call.status === 'ended' 
                                                        ? 'bg-gray-100 text-gray-800'
                                                    : call.status === 'missed'
                                                        ? 'bg-red-100 text-red-800'
                                                    : call.status === 'declined'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-green-100 text-green-800'
                                                }`}>
                                                    {call.status.charAt(0).toUpperCase() + call.status.slice(1)}
                                                </span>
                                                
                                                {call.status === 'ended' && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {moment(call.createdAt).fromNow()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Load More Button */}
                {filteredCalls.length > 0 && (
                    <div className="text-center mt-6">
                        <button
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            disabled={loading}
                            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Loading...' : 'Load More'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CallHistory;
