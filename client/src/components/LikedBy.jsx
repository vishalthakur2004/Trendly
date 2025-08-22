import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { X, Heart } from 'lucide-react';
import Avatar from './Avatar';

const LikedBy = ({ likes = [], className = '' }) => {
    const navigate = useNavigate();
    const currentUser = useSelector((state) => state.user.value);
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

    // Handle legacy format (array of user IDs as strings)
    if (typeof likes[0] === 'string') {
        return (
            <div className={`flex items-center gap-2 text-sm text-gray-700 ${className}`}>
                <div className="flex items-center">
                    <Heart className="w-3 h-3 text-red-500 mr-1" />
                    <button
                        onClick={() => setShowAllLikes(true)}
                        className="font-semibold hover:underline transition-colors"
                    >
                        {likesCount.toLocaleString()}
                        {likesCount === 1 ? ' like' : ' likes'}
                    </button>
                </div>
                {isLikedByCurrentUser && (
                    <span className="text-gray-600">• You liked this</span>
                )}
            </div>
        );
    }

    // Enhanced format with user objects - Instagram-like display
    const renderLikeText = () => {
        if (likesCount === 1) {
            const user = likes[0];
            const isCurrentUser = user._id === currentUser?._id;
            
            return (
                <span className="text-gray-700">
                    Liked by{' '}
                    {isCurrentUser ? (
                        'you'
                    ) : (
                        <button
                            onClick={() => handleUserClick(user)}
                            className="font-semibold text-gray-900 hover:underline transition-colors"
                        >
                            {user.full_name || user.username}
                        </button>
                    )}
                </span>
            );
        }

        if (likesCount === 2) {
            const [user1, user2] = likes;
            const user1IsCurrentUser = user1._id === currentUser?._id;
            const user2IsCurrentUser = user2._id === currentUser?._id;

            return (
                <span className="text-gray-700">
                    Liked by{' '}
                    {user1IsCurrentUser ? (
                        'you'
                    ) : (
                        <button
                            onClick={() => handleUserClick(user1)}
                            className="font-semibold text-gray-900 hover:underline transition-colors"
                        >
                            {user1.full_name || user1.username}
                        </button>
                    )}
                    {' and '}
                    {user2IsCurrentUser ? (
                        'you'
                    ) : (
                        <button
                            onClick={() => handleUserClick(user2)}
                            className="font-semibold text-gray-900 hover:underline transition-colors"
                        >
                            {user2.full_name || user2.username}
                        </button>
                    )}
                </span>
            );
        }

        // More than 2 likes - Instagram style
        if (isLikedByCurrentUser) {
            // Find other user (not current user) to show
            const otherUser = likes.find(user => user._id !== currentUser?._id);
            const remainingCount = likesCount - 1;
            
            if (remainingCount === 1 && otherUser) {
                return (
                    <span className="text-gray-700">
                        Liked by you and{' '}
                        <button
                            onClick={() => handleUserClick(otherUser)}
                            className="font-semibold text-gray-900 hover:underline transition-colors"
                        >
                            {otherUser.full_name || otherUser.username}
                        </button>
                    </span>
                );
            }
            
            return (
                <span className="text-gray-700">
                    Liked by you{otherUser ? ', ' : ' and '}
                    {otherUser && (
                        <>
                            <button
                                onClick={() => handleUserClick(otherUser)}
                                className="font-semibold text-gray-900 hover:underline transition-colors"
                            >
                                {otherUser.full_name || otherUser.username}
                            </button>
                            {' and '}
                        </>
                    )}
                    <button
                        onClick={() => setShowAllLikes(true)}
                        className="font-semibold text-gray-900 hover:underline transition-colors"
                    >
                        {remainingCount - (otherUser ? 1 : 0)} others
                    </button>
                </span>
            );
        }

        // Not liked by current user - show first user and others
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

    // Show all likes modal - Instagram style
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

                    {/* Likes count */}
                    <div className="px-4 py-2 text-sm text-gray-600 border-b border-gray-100">
                        {likesCount.toLocaleString()} {likesCount === 1 ? 'person' : 'people'} liked this
                    </div>

                    {/* Likes List */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="divide-y divide-gray-100">
                            {likes.map((user) => (
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
                                        {user._id === currentUser?._id && (
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                                                <div className="w-2 h-2 bg-white rounded-full"></div>
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
                </div>
            </div>
        );
    }

    return (
        <div className={`text-sm ${className}`}>
            <div className="flex items-center gap-3">
                {/* Stacked avatars - Instagram style */}
                <div className="flex items-center -space-x-2">
                    {likes.slice(0, 3).map((user, index) => (
                        <button
                            key={user._id}
                            onClick={() => handleUserClick(user)}
                            className="relative hover:z-10 transition-transform hover:scale-110 focus:z-10 focus:outline-none"
                            title={user.full_name || user.username}
                        >
                            <img
                                src={user.profile_picture}
                                alt={user.full_name}
                                className="w-6 h-6 rounded-full object-cover border-2 border-white shadow-sm hover:border-gray-100 transition-all duration-200"
                            />
                        </button>
                    ))}
                    {likesCount > 3 && (
                        <button
                            onClick={() => setShowAllLikes(true)}
                            className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white text-xs font-semibold text-gray-600 flex items-center justify-center hover:bg-gray-400 transition-colors duration-200 shadow-sm"
                            title={`+${likesCount - 3} more`}
                        >
                            +{likesCount - 3 > 9 ? '9+' : likesCount - 3}
                        </button>
                    )}
                </div>
                
                {/* Like count and text */}
                <div className="flex items-center gap-2 flex-1">
                    <button
                        onClick={() => setShowAllLikes(true)}
                        className="font-semibold text-gray-900 hover:underline transition-colors"
                    >
                        {likesCount.toLocaleString()}
                        {likesCount === 1 ? ' like' : ' likes'}
                    </button>
                </div>
            </div>
            
            {/* Instagram-style like text */}
            <div className="mt-1 text-gray-700">
                {renderLikeText()}
            </div>
        </div>
    );
};

export default LikedBy;
