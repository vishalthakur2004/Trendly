import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '@clerk/clerk-react';
import { 
    Users, 
    Globe, 
    Lock, 
    EyeOff, 
    Crown, 
    Shield, 
    Calendar,
    MessageCircle,
    UserPlus
} from 'lucide-react';
import moment from 'moment';
import toast from 'react-hot-toast';
import { joinGroup } from '../features/groups/groupsSlice';

const GroupCard = ({ group, showRole = false, showJoinButton = false, onGroupClick }) => {
    const dispatch = useDispatch();
    const { getToken } = useAuth();
    const currentUser = useSelector(state => state.user.value);
    const [isJoining, setIsJoining] = useState(false);

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

    const getUserRole = () => {
        if (!currentUser || !group.members) return null;
        
        const member = group.members.find(m => m.user._id === currentUser._id);
        return member ? member.role : null;
    };

    const handleJoinGroup = async (e) => {
        e.stopPropagation();
        
        if (group.privacy !== 'public') {
            toast.info('This group requires an invitation to join');
            return;
        }

        setIsJoining(true);
        try {
            const token = await getToken();
            await dispatch(joinGroup({ groupId: group._id, token })).unwrap();
            toast.success(`Successfully joined ${group.name}!`);
        } catch (error) {
            toast.error(error || 'Failed to join group');
        } finally {
            setIsJoining(false);
        }
    };

    const formatMemberCount = (count) => {
        if (count >= 1000000) {
            return `${(count / 1000000).toFixed(1)}M`;
        } else if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}K`;
        }
        return count.toString();
    };

    return (
        <div 
            onClick={onGroupClick}
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden border border-gray-100"
        >
            {/* Cover Photo */}
            <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative">
                {group.cover_photo && (
                    <img 
                        src={group.cover_photo} 
                        alt={group.name}
                        className="w-full h-full object-cover"
                    />
                )}
                
                {/* Privacy Badge */}
                <div className="absolute top-3 right-3">
                    <div className="flex items-center gap-1 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs">
                        {getPrivacyIcon(group.privacy)}
                        <span className="capitalize">{group.privacy}</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Profile Picture and Name */}
                <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 -mt-8 border-2 border-white shadow-sm">
                        {group.profile_picture ? (
                            <img 
                                src={group.profile_picture} 
                                alt={group.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                                <Users className="w-6 h-6 text-gray-600" />
                            </div>
                        )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 truncate">{group.name}</h3>
                            {showRole && getUserRole() && getRoleIcon(getUserRole())}
                        </div>
                        
                        <p className="text-sm text-gray-500 capitalize">{group.category}</p>
                    </div>
                </div>

                {/* Description */}
                {group.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {group.description}
                    </p>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{formatMemberCount(group.stats?.member_count || 0)} members</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{moment(group.createdAt).format('MMM YYYY')}</span>
                    </div>
                </div>

                {/* Creator */}
                {group.creator && (
                    <div className="flex items-center gap-2 mb-4 text-sm">
                        <img 
                            src={group.creator.profile_picture} 
                            alt={group.creator.full_name}
                            className="w-6 h-6 rounded-full object-cover"
                        />
                        <span className="text-gray-600">
                            Created by <span className="font-medium text-gray-900">{group.creator.full_name}</span>
                        </span>
                    </div>
                )}

                {/* Tags */}
                {group.tags && group.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                        {group.tags.slice(0, 3).map((tag, index) => (
                            <span 
                                key={index}
                                className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full"
                            >
                                #{tag}
                            </span>
                        ))}
                        {group.tags.length > 3 && (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                +{group.tags.length - 3} more
                            </span>
                        )}
                    </div>
                )}

                {/* Action Button */}
                {showJoinButton && (
                    <button
                        onClick={handleJoinGroup}
                        disabled={isJoining || group.privacy !== 'public'}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            group.privacy === 'public'
                                ? 'bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50'
                                : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        {isJoining ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                {group.privacy === 'public' ? (
                                    <>
                                        <UserPlus className="w-4 h-4" />
                                        Join Group
                                    </>
                                ) : (
                                    <>
                                        <Lock className="w-4 h-4" />
                                        Invitation Required
                                    </>
                                )}
                            </>
                        )}
                    </button>
                )}

                {!showJoinButton && showRole && (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MessageCircle className="w-4 h-4" />
                            <span>View Group</span>
                        </div>
                        
                        {getUserRole() && (
                            <div className="flex items-center gap-1 text-sm">
                                {getRoleIcon(getUserRole())}
                                <span className="capitalize text-gray-600">{getUserRole()}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GroupCard;
