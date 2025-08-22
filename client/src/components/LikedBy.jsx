import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const LikedBy = ({ likes = [], className = '' }) => {
    const navigate = useNavigate();
    const currentUser = useSelector((state) => state.user.value);
    const [showAllLikes, setShowAllLikes] = useState(false);

    if (!likes || likes.length === 0) {
        return null;
    }

    // Handle the case where likes is an array of user IDs (current implementation)
    // For now, we'll just show the count since we don't have user objects
    const likesCount = likes.length;
    const isLikedByCurrentUser = likes.includes(currentUser?._id);

    const handleUserClick = (userId) => {
        navigate(`/profile/${userId}`);
    };

    // If we only have user IDs, show a simplified version
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

    // If we have user objects (future enhancement)
    const displayLikes = showAllLikes ? likes : likes.slice(0, 2);
    const remainingCount = likes.length - displayLikes.length;

    const renderLikeText = () => {
        if (likes.length === 1) {
            const user = likes[0];
            const isCurrentUser = user._id === currentUser?._id;
            
            return (
                <span>
                    Liked by{' '}
                    {isCurrentUser ? (
                        'you'
                    ) : (
                        <button
                            onClick={() => handleUserClick(user._id)}
                            className="font-semibold text-gray-900 hover:underline"
                        >
                            {user.full_name || user.username}
                        </button>
                    )}
                </span>
            );
        }

        if (likes.length === 2) {
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
                            onClick={() => handleUserClick(user1._id)}
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
                            onClick={() => handleUserClick(user2._id)}
                            className="font-semibold text-gray-900 hover:underline"
                        >
                            {user2.full_name || user2.username}
                        </button>
                    )}
                </span>
            );
        }

        // More than 2 likes
        const firstTwo = displayLikes;
        const hasCurrentUser = likes.some(user => user._id === currentUser?._id);
        
        if (hasCurrentUser && !showAllLikes) {
            // Show "you and X others"
            const otherUsers = likes.filter(user => user._id !== currentUser?._id).slice(0, 1);
            const remainingOthers = likes.length - 1 - otherUsers.length;
            
            return (
                <span>
                    Liked by you
                    {otherUsers.length > 0 && (
                        <>
                            {', '}
                            <button
                                onClick={() => handleUserClick(otherUsers[0]._id)}
                                className="font-semibold text-gray-900 hover:underline"
                            >
                                {otherUsers[0].full_name || otherUsers[0].username}
                            </button>
                        </>
                    )}
                    {' and '}
                    <button
                        onClick={() => setShowAllLikes(!showAllLikes)}
                        className="font-semibold text-gray-900 hover:underline"
                    >
                        {remainingOthers} others
                    </button>
                </span>
            );
        }

        // Show first two users and X others
        return (
            <span>
                Liked by{' '}
                {firstTwo.map((user, index) => (
                    <span key={user._id}>
                        <button
                            onClick={() => handleUserClick(user._id)}
                            className="font-semibold text-gray-900 hover:underline"
                        >
                            {user.full_name || user.username}
                        </button>
                        {index === 0 && firstTwo.length > 1 && ', '}
                    </span>
                ))}
                {remainingCount > 0 && (
                    <>
                        {' and '}
                        <button
                            onClick={() => setShowAllLikes(!showAllLikes)}
                            className="font-semibold text-gray-900 hover:underline"
                        >
                            {remainingCount} others
                        </button>
                    </>
                )}
            </span>
        );
    };

    // Show all likes modal/expanded view
    if (showAllLikes && likes.length > 2) {
        return (
            <div className={`text-sm text-gray-600 ${className}`}>
                <div className="space-y-1">
                    {likes.map((user) => (
                        <div key={user._id} className="flex items-center gap-2 py-1">
                            <img
                                src={user.profile_picture}
                                alt={user.full_name}
                                className="w-6 h-6 rounded-full object-cover"
                            />
                            <button
                                onClick={() => handleUserClick(user._id)}
                                className="font-semibold text-gray-900 hover:underline"
                            >
                                {user.full_name || user.username}
                            </button>
                            {user._id === currentUser?._id && (
                                <span className="text-xs text-gray-500">(you)</span>
                            )}
                        </div>
                    ))}
                    <button
                        onClick={() => setShowAllLikes(false)}
                        className="text-xs text-gray-500 hover:text-gray-700 mt-2"
                    >
                        Show less
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`text-sm text-gray-600 ${className}`}>
            {renderLikeText()}
        </div>
    );
};

export default LikedBy;
