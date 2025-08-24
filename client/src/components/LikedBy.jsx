import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { X, Heart, Users } from 'lucide-react';
import Avatar from './Avatar';

const LikedBy = ({ likes = [], className = '' }) => {
    const navigate = useNavigate();
    const currentUser = useSelector((state) => state.user.value);
    const connectionsData = useSelector((state) => state.connections);
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
        return connectionsData.connections?.some(conn => conn._id === user._id) ||
               connectionsData.following?.some(conn => conn._id === user._id) ||
               connectionsData.followers?.some(conn => conn._id === user._id);
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

    // Show expanded likes inline - Instagram style with connections separation
    const renderExpandedLikes = () => {
        if (!showAllLikes) return null;

        return (
            <div className="mt-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-red-500" />
                        <span className="font-semibold text-gray-900 text-sm">
                            {likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}
                        </span>
                        {connections.length > 0 && (
                            <span className="text-xs text-blue-600">
                                • {connections.length} following
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => setShowAllLikes(false)}
                        className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                    >
                        Hide
                    </button>
                </div>

                {/* Likes List - Compact */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {/* People you follow section */}
                    {connections.length > 0 && (
                        <div>
                            {connections.length > 1 && (
                                <div className="text-xs font-medium text-gray-600 mb-1 px-1">
                                    People you follow
                                </div>
                            )}
                            <div className="space-y-1">
                                {connections.map((user) => (
                                    <div
                                        key={user._id}
                                        className="flex items-center gap-2 hover:bg-white hover:bg-opacity-60 p-2 rounded-md transition-colors cursor-pointer group"
                                        onClick={() => handleUserClick(user)}
                                    >
                                        <div className="relative">
                                            <img
                                                src={user.profile_picture}
                                                alt={user.full_name}
                                                className="w-6 h-6 rounded-full object-cover"
                                            />
                                            {user._id === currentUser?._id ? (
                                                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full border border-white"></div>
                                            ) : (
                                                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full border border-white"></div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1">
                                                <span className="font-medium text-gray-900 text-sm truncate">
                                                    {user.full_name || user.username}
                                                </span>
                                                {user._id === currentUser?._id && (
                                                    <span className="text-xs text-blue-600 font-medium">
                                                        (You)
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate">
                                                @{user.username}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Others section */}
                    {others.length > 0 && (
                        <div>
                            {connections.length > 0 && others.length > 0 && (
                                <div className="text-xs font-medium text-gray-600 mb-1 px-1 mt-3">
                                    Others
                                </div>
                            )}
                            <div className="space-y-1">
                                {others.slice(0, 10).map((user) => (
                                    <div
                                        key={user._id}
                                        className="flex items-center gap-2 hover:bg-white hover:bg-opacity-60 p-2 rounded-md transition-colors cursor-pointer group"
                                        onClick={() => handleUserClick(user)}
                                    >
                                        <img
                                            src={user.profile_picture}
                                            alt={user.full_name}
                                            className="w-6 h-6 rounded-full object-cover"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <span className="font-medium text-gray-900 text-sm truncate block">
                                                {user.full_name || user.username}
                                            </span>
                                            <div className="text-xs text-gray-500 truncate">
                                                @{user.username}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {others.length > 10 && (
                                    <div className="text-xs text-gray-500 px-2 py-1">
                                        and {others.length - 10} more...
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className={`space-y-2 ${className}`}>
            {/* Total likes count - prominent Instagram style */}
            <button
                onClick={() => setShowAllLikes(!showAllLikes)}
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

            {/* Expanded likes section */}
            {renderExpandedLikes()}
        </div>
    );
};

export default LikedBy;
