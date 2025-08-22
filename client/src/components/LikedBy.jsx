import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { X, Heart, Users } from 'lucide-react';
import Avatar from './Avatar';

const LikedBy = ({ likes = [], className = '' }) => {
    const navigate = useNavigate();
    const currentUser = useSelector((state) => state.user.value);
    const connections = useSelector((state) => state.connections);
    const [showAllLikes, setShowAllLikes] = useState(false);

    if (!likes || likes.length === 0) {
        return null;
    }

    const likesCount = likes.length;
    const isLikedByCurrentUser = likes.some(user => 
        typeof user === 'string' ? user === currentUser?._id : user._id === currentUser?._id
    );

    const handleUserClick = (user) => {
        const userId = typeof user === 'string' ? user : user._id;
        navigate(`/profile/${userId}`);
        setShowAllLikes(false);
    };

    // Helper function to check if user is a connection/following
    const isConnection = (user) => {
        if (!currentUser || typeof user === 'string') return false;
        return currentUser.connections?.includes(user._id) || 
               currentUser.following?.includes(user._id);
    };

    // Handle legacy format (array of user IDs as strings)
    if (typeof likes[0] === 'string') {
        return (
            <div className={`space-y-1 ${className}`}>
                {/* Total likes count - prominent */}
                <button
                    onClick={() => setShowAllLikes(true)}
                    className="flex items-center gap-1 text-sm font-semibold text-gray-900 hover:text-gray-700 transition-colors"
                >
                    <Heart className="w-4 h-4 text-red-500" />
                    {likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}
                </button>
                
                {isLikedByCurrentUser && (
                    <div className="text-sm text-gray-600">
                        You and {likesCount - 1} others liked this
                    </div>
                )}
            </div>
        );
    }

    // Separate connections from others
    const connections = likes.filter(user => user._id === currentUser?._id || isConnection(user));
    const others = likes.filter(user => user._id !== currentUser?._id && !isConnection(user));
    
    // Enhanced format with user objects - Instagram-like display
    const renderLikeText = () => {
        const connectionsCount = connections.length;
        const othersCount = others.length;
        
        if (likesCount === 1) {
            const user = likes[0];
            const isCurrentUser = user._id === currentUser?._id;
            const userIsConnection = isConnection(user);
            
            return (
                <span className="text-gray-700">
                    Liked by{' '}
                    {isCurrentUser ? (
                        <span className="font-semibold text-gray-900">you</span>
                    ) : (
                        <button
                            onClick={() => handleUserClick(user)}
                            className={`font-semibold hover:underline transition-colors ${
                                userIsConnection ? 'text-blue-600' : 'text-gray-900'
                            }`}
                        >
                            {user.full_name || user.username}
                            {userIsConnection && <span className="text-blue-500 ml-1">•</span>}
                        </button>
                    )}
                </span>
            );
        }

        // Prioritize showing connections first
        if (connectionsCount > 0) {
            const firstConnection = connections.find(user => user._id !== currentUser?._id) || connections[0];
            
            if (isLikedByCurrentUser) {
                if (connectionsCount === 1 && othersCount === 0) {
                    return (
                        <span className="text-gray-700">
                            Liked by <span className="font-semibold text-gray-900">you</span>
                        </span>
                    );
                }
                
                if (connectionsCount === 2 && othersCount === 0) {
                    const otherConnection = connections.find(user => user._id !== currentUser?._id);
                    return (
                        <span className="text-gray-700">
                            Liked by <span className="font-semibold text-gray-900">you</span> and{' '}
                            <button
                                onClick={() => handleUserClick(otherConnection)}
                                className="font-semibold text-blue-600 hover:underline transition-colors"
                            >
                                {otherConnection.full_name || otherConnection.username}
                                <span className="text-blue-500 ml-1">•</span>
                            </button>
                        </span>
                    );
                }
                
                return (
                    <span className="text-gray-700">
                        Liked by <span className="font-semibold text-gray-900">you</span>
                        {firstConnection && firstConnection._id !== currentUser?._id && (
                            <>
                                ,{' '}
                                <button
                                    onClick={() => handleUserClick(firstConnection)}
                                    className="font-semibold text-blue-600 hover:underline transition-colors"
                                >
                                    {firstConnection.full_name || firstConnection.username}
                                    <span className="text-blue-500 ml-1">•</span>
                                </button>
                            </>
                        )}
                        {' and '}
                        <button
                            onClick={() => setShowAllLikes(true)}
                            className="font-semibold text-gray-900 hover:underline transition-colors"
                        >
                            {likesCount - (firstConnection && firstConnection._id !== currentUser?._id ? 2 : 1)} others
                        </button>
                    </span>
                );
            } else {
                // User hasn't liked, but connections have
                if (connectionsCount === 1 && othersCount === 0) {
                    return (
                        <span className="text-gray-700">
                            Liked by{' '}
                            <button
                                onClick={() => handleUserClick(firstConnection)}
                                className="font-semibold text-blue-600 hover:underline transition-colors"
                            >
                                {firstConnection.full_name || firstConnection.username}
                                <span className="text-blue-500 ml-1">•</span>
                            </button>
                        </span>
                    );
                }
                
                return (
                    <span className="text-gray-700">
                        Liked by{' '}
                        <button
                            onClick={() => handleUserClick(firstConnection)}
                            className="font-semibold text-blue-600 hover:underline transition-colors"
                        >
                            {firstConnection.full_name || firstConnection.username}
                            <span className="text-blue-500 ml-1">•</span>
                        </button>
                        {' and '}
                        <button
                            onClick={() => setShowAllLikes(true)}
                            className="font-semibold text-gray-900 hover:underline transition-colors"
                        >
                            {likesCount - 1} others
                        </button>
                    </span>
                );
            }
        }

        // No connections, show regular format
        const [firstUser] = likes;
        const remainingCount = likesCount - 1;
        
        if (remainingCount === 0) {
            return (
                <span className="text-gray-700">
                    Liked by{' '}
                    <button
                        onClick={() => handleUserClick(firstUser)}
                        className="font-semibold text-gray-900 hover:underline transition-colors"
                    >
                        {firstUser.full_name || firstUser.username}
                    </button>
                </span>
            );
        }
        
        return (
            <span className="text-gray-700">
                Liked by{' '}
                <button
                    onClick={() => handleUserClick(firstUser)}
                    className="font-semibold text-gray-900 hover:underline transition-colors"
                >
                    {firstUser.full_name || firstUser.username}
                </button>
                {' and '}
                <button
                    onClick={() => setShowAllLikes(true)}
                    className="font-semibold text-gray-900 hover:underline transition-colors"
                >
                    {remainingCount} others
                </button>
            </span>
        );
    };

    // Show all likes modal - Instagram style with connections separation
    if (showAllLikes) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl w-full max-w-sm max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="text-base font-semibold text-gray-900">
                            Likes
                        </h3>
                        <button
                            onClick={() => setShowAllLikes(false)}
                            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors duration-200"
                        >
                            <X className="w-4 h-4 text-gray-600" />
                        </button>
                    </div>

                    {/* Total likes count */}
                    <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <Heart className="w-5 h-5 text-red-500" />
                            <span className="font-semibold text-gray-900">
                                {likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}
                            </span>
                        </div>
                        {connections.length > 0 && (
                            <div className="flex items-center gap-1 mt-1 text-sm text-blue-600">
                                <Users className="w-4 h-4" />
                                <span>{connections.length} from people you follow</span>
                            </div>
                        )}
                    </div>

                    {/* Likes List */}
                    <div className="flex-1 overflow-y-auto">
                        {/* People you follow section */}
                        {connections.length > 0 && (
                            <div>
                                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                                    <span className="text-sm font-medium text-gray-700">People you follow</span>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {connections.map((user) => (
                                        <div 
                                            key={user._id} 
                                            className="flex items-center gap-3 hover:bg-gray-50 p-3 transition-colors cursor-pointer group"
                                            onClick={() => handleUserClick(user)}
                                        >
                                            <div className="relative">
                                                <Avatar
                                                    src={user.profile_picture}
                                                    name={user.full_name}
                                                    size="sm"
                                                    className="ring-2 ring-white group-hover:ring-blue-100 transition-all"
                                                />
                                                {user._id === currentUser?._id ? (
                                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                                    </div>
                                                ) : (
                                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                                                        <div className="w-1 h-1 bg-white rounded-full"></div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-gray-900 truncate">
                                                        {user.full_name || user.username}
                                                    </span>
                                                    {user._id === currentUser?._id && (
                                                        <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
                                                            You
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-500 truncate">
                                                    @{user.username}
                                                </div>
                                            </div>
                                            <Heart className="w-4 h-4 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Others section */}
                        {others.length > 0 && (
                            <div>
                                {connections.length > 0 && (
                                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-700">Others</span>
                                    </div>
                                )}
                                <div className="divide-y divide-gray-100">
                                    {others.map((user) => (
                                        <div 
                                            key={user._id} 
                                            className="flex items-center gap-3 hover:bg-gray-50 p-3 transition-colors cursor-pointer group"
                                            onClick={() => handleUserClick(user)}
                                        >
                                            <div className="relative">
                                                <Avatar
                                                    src={user.profile_picture}
                                                    name={user.full_name}
                                                    size="sm"
                                                    className="ring-2 ring-white group-hover:ring-gray-100 transition-all"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-gray-900 truncate">
                                                        {user.full_name || user.username}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-gray-500 truncate">
                                                    @{user.username}
                                                </div>
                                            </div>
                                            <Heart className="w-4 h-4 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`space-y-2 ${className}`}>
            {/* Total likes count - prominent Instagram style */}
            <button
                onClick={() => setShowAllLikes(true)}
                className="flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-gray-700 transition-colors group"
            >
                <div className="flex items-center -space-x-1">
                    {likes.slice(0, 3).map((user, index) => (
                        <img
                            key={user._id}
                            src={user.profile_picture}
                            alt={user.full_name}
                            className="w-5 h-5 rounded-full object-cover border border-white group-hover:border-gray-200 transition-colors"
                        />
                    ))}
                </div>
                <span>{likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}</span>
                {connections.length > 0 && (
                    <span className="text-blue-600">• {connections.length} following</span>
                )}
            </button>
            
            {/* Instagram-style like text */}
            <div className="text-sm text-gray-700">
                {renderLikeText()}
            </div>
        </div>
    );
};

export default LikedBy;
