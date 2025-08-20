import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '@clerk/clerk-react';
import { 
    ArrowLeft, 
    Settings, 
    Users, 
    MessageCircle, 
    Phone, 
    Video,
    UserPlus,
    Crown,
    Shield,
    MoreVertical,
    Pin,
    Globe,
    Lock,
    EyeOff,
    Edit3,
    Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getGroupDetails, leaveGroup, updateGroup } from '../features/groups/groupsSlice';
import { getGroupPosts } from '../features/groups/groupPostsSlice';
import { initiateCall } from '../features/calls/callsSlice';
import socketService from '../services/socketService';
import Loading from '../components/Loading';
import GroupPostCard from '../components/GroupPostCard';
import GroupMembersList from '../components/GroupMembersList';
import GroupSettingsModal from '../components/GroupSettingsModal';

const GroupDetail = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { getToken } = useAuth();
    
    const { currentGroup, loading, error } = useSelector(state => state.groups);
    const { posts } = useSelector(state => state.groupPosts);
    const currentUser = useSelector(state => state.user.value);
    
    const [activeTab, setActiveTab] = useState('posts');
    const [showSettings, setShowSettings] = useState(false);
    const [showMembers, setShowMembers] = useState(false);
    const [isJoiningCall, setIsJoiningCall] = useState(false);

    useEffect(() => {
        const loadGroupData = async () => {
            try {
                const token = await getToken();
                await dispatch(getGroupDetails({ groupId, token }));
                await dispatch(getGroupPosts({ groupId, page: 1, limit: 20, token }));
            } catch (error) {
                console.error('Error loading group data:', error);
                toast.error('Failed to load group data');
            }
        };

        if (groupId) {
            loadGroupData();
        }
    }, [groupId, dispatch, getToken]);

    // Join group socket room
    useEffect(() => {
        if (currentGroup && currentUser) {
            socketService.socket?.emit('join-group', {
                groupId: currentGroup._id,
                userId: currentUser._id
            });

            return () => {
                socketService.socket?.emit('leave-group', {
                    groupId: currentGroup._id,
                    userId: currentUser._id
                });
            };
        }
    }, [currentGroup, currentUser]);

    const getUserRole = () => {
        if (!currentUser || !currentGroup) return null;
        const member = currentGroup.members?.find(m => m.user._id === currentUser._id);
        return member ? member.role : null;
    };

    const isCreator = () => {
        return currentGroup?.creator._id === currentUser?._id;
    };

    const isAdmin = () => {
        return getUserRole() === 'admin' || isCreator();
    };

    const isModerator = () => {
        return getUserRole() === 'moderator' || isAdmin();
    };

    const handleStartGroupCall = async (callType) => {
        if (!currentGroup?.settings?.allow_member_calls && !isAdmin()) {
            toast.error('Group calls are not allowed');
            return;
        }

        setIsJoiningCall(true);
        try {
            const token = await getToken();
            
            const participants = currentGroup.members
                .filter(member => member.user._id !== currentUser._id)
                .map(member => member.user._id);

            const result = await dispatch(initiateCall({
                callType,
                isGroupCall: true,
                groupId: currentGroup._id,
                token
            })).unwrap();

            // Send socket signal for group call
            socketService.initiateCall({
                callId: result.call_id,
                callType,
                initiatorData: currentUser,
                isGroupCall: true,
                groupId: currentGroup._id,
                participants
            });

            toast.success(`${callType} call started in ${currentGroup.name}`);

        } catch (error) {
            console.error('Error starting group call:', error);
            toast.error(`Failed to start ${callType} call`);
        } finally {
            setIsJoiningCall(false);
        }
    };

    const handleLeaveGroup = async () => {
        if (isCreator()) {
            toast.error('Group creator cannot leave. Please transfer ownership first.');
            return;
        }

        if (window.confirm('Are you sure you want to leave this group?')) {
            try {
                const token = await getToken();
                await dispatch(leaveGroup({ groupId: currentGroup._id, token })).unwrap();
                toast.success('Successfully left the group');
                navigate('/groups');
            } catch (error) {
                toast.error(error || 'Failed to leave group');
            }
        }
    };

    const getPrivacyIcon = (privacy) => {
        switch (privacy) {
            case 'public':
                return <Globe className="w-4 h-4 text-green-500" />;
            case 'private':
                return <Lock className="w-4 h-4 text-orange-500" />;
            case 'secret':
                return <EyeOff className="w-4 h-4 text-red-500" />;
            default:
                return <Globe className="w-4 h-4 text-green-500" />;
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'admin':
                return <Crown className="w-4 h-4 text-yellow-500" />;
            case 'moderator':
                return <Shield className="w-4 h-4 text-blue-500" />;
            default:
                return null;
        }
    };

    if (loading) {
        return <Loading />;
    }

    if (error || !currentGroup) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Group not found</h3>
                    <p className="text-gray-500 mb-4">The group you're looking for doesn't exist or you don't have access to it.</p>
                    <button
                        onClick={() => navigate('/groups')}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        Back to Groups
                    </button>
                </div>
            </div>
        );
    }

    const groupPosts = posts[groupId] || [];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/groups')}
                            className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900">{currentGroup.name}</h1>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                <div className="flex items-center gap-1">
                                    {getPrivacyIcon(currentGroup.privacy)}
                                    <span className="capitalize">{currentGroup.privacy} Group</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    <span>{currentGroup.stats?.member_count || 0} members</span>
                                </div>
                                {getUserRole() && (
                                    <div className="flex items-center gap-1">
                                        {getRoleIcon(getUserRole())}
                                        <span className="capitalize">{getUserRole()}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            {currentGroup.settings?.allow_member_calls && (
                                <>
                                    <button
                                        onClick={() => handleStartGroupCall('voice')}
                                        disabled={isJoiningCall}
                                        className="flex items-center gap-2 px-3 py-2 text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                                        title="Start Voice Call"
                                    >
                                        <Phone className="w-4 h-4" />
                                        <span className="hidden sm:inline">Voice Call</span>
                                    </button>
                                    
                                    <button
                                        onClick={() => handleStartGroupCall('video')}
                                        disabled={isJoiningCall}
                                        className="flex items-center gap-2 px-3 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                                        title="Start Video Call"
                                    >
                                        <Video className="w-4 h-4" />
                                        <span className="hidden sm:inline">Video Call</span>
                                    </button>
                                </>
                            )}

                            <button
                                onClick={() => setShowMembers(true)}
                                className="flex items-center gap-2 px-3 py-2 text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                title="View Members"
                            >
                                <Users className="w-4 h-4" />
                                <span className="hidden sm:inline">Members</span>
                            </button>

                            {(isAdmin() || isModerator()) && (
                                <button
                                    onClick={() => setShowSettings(true)}
                                    className="flex items-center gap-2 px-3 py-2 text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                    title="Group Settings"
                                >
                                    <Settings className="w-4 h-4" />
                                    <span className="hidden sm:inline">Settings</span>
                                </button>
                            )}

                            {!isCreator() && (
                                <button
                                    onClick={handleLeaveGroup}
                                    className="flex items-center gap-2 px-3 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                    title="Leave Group"
                                >
                                    <span className="hidden sm:inline">Leave Group</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Cover Photo */}
            {currentGroup.cover_photo && (
                <div className="h-48 bg-gray-200">
                    <img 
                        src={currentGroup.cover_photo} 
                        alt={currentGroup.name}
                        className="w-full h-full object-cover"
                    />
                </div>
            )}

            {/* Group Info */}
            <div className="max-w-6xl mx-auto px-6 py-6">
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="flex items-start gap-4">
                        {/* Group Avatar */}
                        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 border-gray-200">
                            {currentGroup.profile_picture ? (
                                <img 
                                    src={currentGroup.profile_picture} 
                                    alt={currentGroup.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                                    <Users className="w-8 h-8 text-gray-600" />
                                </div>
                            )}
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <h2 className="text-xl font-semibold text-gray-900">{currentGroup.name}</h2>
                                {currentGroup.category && (
                                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full capitalize">
                                        {currentGroup.category}
                                    </span>
                                )}
                            </div>
                            
                            {currentGroup.description && (
                                <p className="text-gray-600 mb-3">{currentGroup.description}</p>
                            )}

                            {/* Tags */}
                            {currentGroup.tags && currentGroup.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {currentGroup.tags.map((tag, index) => (
                                        <span 
                                            key={index}
                                            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="flex">
                            {['posts', 'members', 'about'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                                        activeTab === tab
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === 'posts' && (
                            <div className="space-y-4">
                                {groupPosts.length === 0 ? (
                                    <div className="text-center py-8">
                                        <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                                        <p className="text-gray-500">Be the first to post in this group!</p>
                                    </div>
                                ) : (
                                    groupPosts.map(post => (
                                        <GroupPostCard 
                                            key={post._id} 
                                            post={post} 
                                            groupId={groupId}
                                            canModerate={isAdmin() || isModerator()}
                                        />
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'members' && (
                            <GroupMembersList 
                                group={currentGroup}
                                currentUserRole={getUserRole()}
                                canModerate={isAdmin() || isModerator()}
                            />
                        )}

                        {activeTab === 'about' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-medium text-gray-900 mb-2">Created by</h3>
                                    <div className="flex items-center gap-3">
                                        <img 
                                            src={currentGroup.creator.profile_picture} 
                                            alt={currentGroup.creator.full_name}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900">{currentGroup.creator.full_name}</p>
                                            <p className="text-sm text-gray-500">@{currentGroup.creator.username}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-medium text-gray-900 mb-2">Group Settings</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center justify-between">
                                            <span>Member posts</span>
                                            <span className={currentGroup.settings?.allow_member_posts ? 'text-green-600' : 'text-red-600'}>
                                                {currentGroup.settings?.allow_member_posts ? 'Allowed' : 'Not allowed'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span>Member invites</span>
                                            <span className={currentGroup.settings?.allow_member_invites ? 'text-green-600' : 'text-red-600'}>
                                                {currentGroup.settings?.allow_member_invites ? 'Allowed' : 'Not allowed'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span>Group calls</span>
                                            <span className={currentGroup.settings?.allow_member_calls ? 'text-green-600' : 'text-red-600'}>
                                                {currentGroup.settings?.allow_member_calls ? 'Allowed' : 'Not allowed'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showSettings && (
                <GroupSettingsModal 
                    group={currentGroup}
                    onClose={() => setShowSettings(false)}
                    onUpdate={(updatedGroup) => {
                        setShowSettings(false);
                        // The group will be updated via Redux
                    }}
                />
            )}

            {showMembers && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold">Group Members</h3>
                            <button 
                                onClick={() => setShowMembers(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-4 max-h-96 overflow-y-auto">
                            <GroupMembersList 
                                group={currentGroup}
                                currentUserRole={getUserRole()}
                                canModerate={isAdmin() || isModerator()}
                                compact={true}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupDetail;
