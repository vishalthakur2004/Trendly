import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Send, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@clerk/clerk-react';
import { sharePost, fetchUserConnections, clearShareState } from '../features/posts/postsSlice';

const ShareModal = ({ postId, isOpen, onClose }) => {
    const dispatch = useDispatch();
    const { getToken } = useAuth();
    const { connections, sharing } = useSelector((state) => state.posts);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [shareMessage, setShareMessage] = useState('');

    useEffect(() => {
        if (isOpen && connections.length === 0) {
            const loadConnections = async () => {
                const token = await getToken();
                dispatch(fetchUserConnections({ token }));
            };
            loadConnections();
        }
    }, [isOpen, dispatch, connections.length, getToken]);

    useEffect(() => {
        if (!isOpen) {
            setSelectedUsers([]);
            setSearchTerm('');
            setShareMessage('');
            dispatch(clearShareState());
        }
    }, [isOpen, dispatch]);

    const filteredConnections = connections.filter(connection =>
        connection.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        connection.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleUserSelect = (user) => {
        setSelectedUsers(prev => {
            const isSelected = prev.some(u => u._id === user._id);
            if (isSelected) {
                return prev.filter(u => u._id !== user._id);
            } else {
                return [...prev, user];
            }
        });
    };

    const handleShare = async () => {
        if (selectedUsers.length === 0) {
            toast.error('Please select at least one person to share with');
            return;
        }

        try {
            const token = await getToken();
            const recipientIds = selectedUsers.map(user => user._id);
            await dispatch(sharePost({
                postId,
                recipientIds,
                message: shareMessage,
                token
            })).unwrap();

            toast.success(`Post shared with ${selectedUsers.length} ${selectedUsers.length === 1 ? 'person' : 'people'}`);
            onClose();
        } catch (error) {
            toast.error(error);
        }
    };

    const removeSelectedUser = (userId) => {
        setSelectedUsers(prev => prev.filter(u => u._id !== userId));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[70vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold">Share Post</h3>
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search contacts..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Selected Users */}
                {selectedUsers.length > 0 && (
                    <div className="p-4 border-b border-gray-100">
                        <div className="flex flex-wrap gap-2">
                            {selectedUsers.map(user => (
                                <div 
                                    key={user._id}
                                    className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                                >
                                    <img 
                                        src={user.profile_picture} 
                                        alt={user.full_name}
                                        className="w-5 h-5 rounded-full"
                                    />
                                    <span>{user.full_name}</span>
                                    <button 
                                        onClick={() => removeSelectedUser(user._id)}
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Message Input */}
                <div className="p-4 border-b border-gray-100">
                    <textarea
                        value={shareMessage}
                        onChange={(e) => setShareMessage(e.target.value)}
                        placeholder="Add a message (optional)..."
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                </div>

                {/* Connections List */}
                <div className="flex-1 overflow-y-auto">
                    {filteredConnections.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            {searchTerm ? 'No contacts found' : 'No connections available'}
                        </div>
                    ) : (
                        <div className="p-2">
                            {filteredConnections.map(connection => {
                                const isSelected = selectedUsers.some(u => u._id === connection._id);
                                return (
                                    <button
                                        key={connection._id}
                                        onClick={() => handleUserSelect(connection)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors ${
                                            isSelected ? 'bg-blue-50 border-2 border-blue-200' : ''
                                        }`}
                                    >
                                        <img 
                                            src={connection.profile_picture} 
                                            alt={connection.full_name}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                        <div className="flex-1 text-left">
                                            <div className="font-medium text-sm">{connection.full_name}</div>
                                            <div className="text-gray-500 text-xs">@{connection.username}</div>
                                        </div>
                                        {isSelected && (
                                            <div className="text-blue-500">
                                                <Check className="w-5 h-5" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200">
                    <div className="flex gap-3">
                        <button 
                            onClick={onClose}
                            className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleShare}
                            disabled={selectedUsers.length === 0 || sharing.loading}
                            className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {sharing.loading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Share
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
