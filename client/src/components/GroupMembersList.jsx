import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '@clerk/clerk-react';
import { 
    Crown, 
    Shield, 
    MoreVertical, 
    UserMinus, 
    UserCheck,
    Settings,
    MessageCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { removeMember, updateMemberRole, inviteMember } from '../features/groups/groupsSlice';

const GroupMembersList = ({ group, currentUserRole, canModerate = false, compact = false }) => {
    const dispatch = useDispatch();
    const { getToken } = useAuth();
    const currentUser = useSelector(state => state.user.value);
    
    const [showMenuFor, setShowMenuFor] = useState(null);
    const [showRoleModal, setShowRoleModal] = useState(null);

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

    const getRoleColor = (role) => {
        switch (role) {
            case 'admin':
                return 'text-yellow-600 bg-yellow-50';
            case 'moderator':
                return 'text-blue-600 bg-blue-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };

    const canManageMember = (member) => {
        if (!canModerate) return false;
        if (member.user._id === currentUser._id) return false;
        if (member.user._id === group.creator._id) return false;
        
        // Admins can manage moderators and members
        if (currentUserRole === 'admin') {
            return member.role !== 'admin';
        }
        
        // Moderators can only manage regular members
        if (currentUserRole === 'moderator') {
            return member.role === 'member';
        }
        
        return false;
    };

    const handleRemoveMember = async (memberId) => {
        if (window.confirm('Are you sure you want to remove this member?')) {
            try {
                const token = await getToken();
                await dispatch(removeMember({ 
                    groupId: group._id, 
                    memberId, 
                    token 
                })).unwrap();
                toast.success('Member removed successfully');
                setShowMenuFor(null);
            } catch (error) {
                toast.error(error || 'Failed to remove member');
            }
        }
    };

    const handleUpdateRole = async (memberId, newRole) => {
        try {
            const token = await getToken();
            await dispatch(updateMemberRole({ 
                groupId: group._id, 
                memberId, 
                newRole, 
                token 
            })).unwrap();
            toast.success('Member role updated successfully');
            setShowRoleModal(null);
            setShowMenuFor(null);
        } catch (error) {
            toast.error(error || 'Failed to update member role');
        }
    };

    const sortedMembers = [...(group.members || [])].sort((a, b) => {
        // Creator first
        if (a.user._id === group.creator._id) return -1;
        if (b.user._id === group.creator._id) return 1;
        
        // Then admins
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (b.role === 'admin' && a.role !== 'admin') return 1;
        
        // Then moderators
        if (a.role === 'moderator' && b.role === 'member') return -1;
        if (b.role === 'moderator' && a.role === 'member') return 1;
        
        // Then by name
        return a.user.full_name.localeCompare(b.user.full_name);
    });

    return (
        <div className="space-y-3">
            {sortedMembers.map((member) => (
                <div key={member.user._id} className={`flex items-center gap-3 ${compact ? 'py-2' : 'p-3 bg-gray-50 rounded-lg'}`}>
                    {/* Avatar */}
                    <img 
                        src={member.user.profile_picture} 
                        alt={member.user.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                    />
                    
                    {/* Member Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900 truncate">
                                {member.user.full_name}
                            </h4>
                            {member.user._id === group.creator._id && (
                                <Crown className="w-4 h-4 text-yellow-500" title="Creator" />
                            )}
                            {member.user._id !== group.creator._id && getRoleIcon(member.role)}
                        </div>
                        <div className="flex items-center gap-2">
                            <p className="text-sm text-gray-500">@{member.user.username}</p>
                            {member.user._id === group.creator._id ? (
                                <span className="px-2 py-0.5 text-xs text-yellow-600 bg-yellow-50 rounded-full">
                                    Creator
                                </span>
                            ) : (
                                <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${getRoleColor(member.role)}`}>
                                    {member.role}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    {member.user._id !== currentUser._id && (
                        <div className="flex items-center gap-2">
                            {/* Message Button */}
                            <button
                                onClick={() => {/* Navigate to DM */}}
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                                title="Send Message"
                            >
                                <MessageCircle className="w-4 h-4" />
                            </button>

                            {/* Management Menu */}
                            {canManageMember(member) && (
                                <div className="relative">
                                    <button
                                        onClick={() => setShowMenuFor(showMenuFor === member.user._id ? null : member.user._id)}
                                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                                    >
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                    
                                    {showMenuFor === member.user._id && (
                                        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-40">
                                            <button
                                                onClick={() => setShowRoleModal(member.user._id)}
                                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                            >
                                                <Settings className="w-4 h-4" />
                                                Change Role
                                            </button>
                                            <button
                                                onClick={() => handleRemoveMember(member.user._id)}
                                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                                            >
                                                <UserMinus className="w-4 h-4" />
                                                Remove
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}

            {/* Role Change Modal */}
            {showRoleModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-sm w-full p-6">
                        <h3 className="text-lg font-semibold mb-4">Change Member Role</h3>
                        
                        <div className="space-y-2 mb-6">
                            {['member', 'moderator', 'admin'].map((role) => {
                                const member = sortedMembers.find(m => m.user._id === showRoleModal);
                                const isCurrentRole = member?.role === role;
                                const canAssignRole = currentUserRole === 'admin' || 
                                    (currentUserRole === 'moderator' && role === 'member');
                                
                                if (!canAssignRole && !isCurrentRole) return null;
                                
                                return (
                                    <button
                                        key={role}
                                        onClick={() => handleUpdateRole(showRoleModal, role)}
                                        disabled={isCurrentRole}
                                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                                            isCurrentRole 
                                                ? 'border-blue-500 bg-blue-50 text-blue-600' 
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        } disabled:cursor-not-allowed`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {getRoleIcon(role)}
                                            <span className="capitalize font-medium">{role}</span>
                                            {isCurrentRole && <UserCheck className="w-4 h-4 ml-auto" />}
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {role === 'admin' && 'Full administrative privileges'}
                                            {role === 'moderator' && 'Can moderate content and manage members'}
                                            {role === 'member' && 'Basic group participation'}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowRoleModal(null)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupMembersList;
