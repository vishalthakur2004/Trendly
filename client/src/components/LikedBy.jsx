import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { X } from 'lucide-react';

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
            <div className={`text-sm text-gray-600 ${className}`}>
                {likesCount === 1 && isLikedByCurrentUser && (
                    <span>Liked by you</span>
                )}
                {likesCount === 1 && !isLikedByCurrentUser && (
                    <span>1 like</span>
                )}
                {likesCount === 2 && isLikedByCurrentUser && (
                    <span>Liked by you and 1 other</span>
                )}
                {likesCount === 2 && !isLikedByCurrentUser && (
                    <span>2 likes</span>
                )}
                {likesCount > 2 && isLikedByCurrentUser && (
                    <span>Liked by you and {likesCount - 1} others</span>
                )}
                {likesCount > 2 && !isLikedByCurrentUser && (
                    <span>{likesCount} likes</span>
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
                <span>
                    Liked by{' '}
                    {isCurrentUser ? (
                        'you'
                    ) : (
                        <button
                            onClick={() => handleUserClick(user)}
                            className="font-semibold text-gray-900 hover:underline"
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
                <span>
                    Liked by{' '}
                    {user1IsCurrentUser ? (
                        'you'
                    ) : (
                        <button
                            onClick={() => handleUserClick(user1)}
                            className="font-semibold text-gray-900 hover:underline"
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
                            className="font-semibold text-gray-900 hover:underline"
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
                    <span>
                        Liked by you and{' '}
                        <button
                            onClick={() => handleUserClick(otherUser)}
                            className="font-semibold text-gray-900 hover:underline"
                        >
                            {otherUser.full_name || otherUser.username}
                        </button>
                    </span>
                );
            }
            
            return (
                <span>
                    Liked by you{otherUser ? ', ' : ' and '}
                    {otherUser && (
                        <>
                            <button
                                onClick={() => handleUserClick(otherUser)}
                                className="font-semibold text-gray-900 hover:underline"
                            >
                                {otherUser.full_name || otherUser.username}
                            </button>
                            {' and '}
                        </>
                    )}
                    <button
                        onClick={() => setShowAllLikes(true)}
                        className="font-semibold text-gray-900 hover:underline"
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
                <span>
                    Liked by{' '}
                    <button
                        onClick={() => handleUserClick(firstUser)}
                        className="font-semibold text-gray-900 hover:underline"
                    >
                        {firstUser.full_name || firstUser.username}
                    </button>
                </span>
            );
        }
        
        return (
            <span>
                Liked by{' '}
                <button
                    onClick={() => handleUserClick(firstUser)}
                    className="font-semibold text-gray-900 hover:underline"
                >
                    {firstUser.full_name || firstUser.username}
                </button>
                {' and '}
                <button
                    onClick={() => setShowAllLikes(true)}
                    className="font-semibold text-gray-900 hover:underline"
                >
                    {remainingCount} others
                </button>
            </span>
        );
    };

    // Show all likes modal
    if (showAllLikes) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl w-full max-w-md max-h-[70vh] flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Likes ({likesCount})
                        </h3>
                        <button
                            onClick={() => setShowAllLikes(false)}
                            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Likes List */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="space-y-3">
                            {likes.map((user) => (
                                <div 
                                    key={user._id} 
                                    className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition-colors cursor-pointer"
                                    onClick={() => handleUserClick(user)}
                                >
                                    <img
                                        src={user.profile_picture}
                                        alt={user.full_name}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                    <div className="flex-1">
                                        <div className="font-semibold text-gray-900">
                                            {user.full_name || user.username}
                                            {user._id === currentUser?._id && (
                                                <span className="text-sm text-gray-500 font-normal ml-2">(you)</span>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            @{user.username}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`text-sm text-gray-600 ${className}`}>
            <div className="flex items-center gap-2">
                {/* Small avatars for first few likers */}
                {likes.slice(0, 3).map((user, index) => (
                    <button
                        key={user._id}
                        onClick={() => handleUserClick(user)}
                        className="relative"
                        style={{ marginLeft: index > 0 ? '-6px' : '0' }}
                    >
                        <img
                            src={user.profile_picture}
                            alt={user.full_name}
                            className="w-6 h-6 rounded-full object-cover border-2 border-white hover:border-gray-200 transition-colors"
                        />
                    </button>
                ))}
                
                {/* Text */}
                <div className="flex-1">
                    {renderLikeText()}
                </div>
            </div>
        </div>
    );
};

export default LikedBy;
