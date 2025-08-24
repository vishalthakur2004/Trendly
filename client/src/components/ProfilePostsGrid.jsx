import React, { useState } from 'react';
import { Heart, MessageCircle, Users } from 'lucide-react';
import PostCard from './PostCard';

const ProfilePostsGrid = ({ posts }) => {
    const [selectedPost, setSelectedPost] = useState(null);

    if (!posts || posts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-24 h-24 border-2 border-gray-300 rounded-full flex items-center justify-center mb-6">
                    <div className="w-16 h-16 border-2 border-gray-300 rounded-lg"></div>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No posts yet</h2>
                <p className="text-gray-600 text-center max-w-sm">
                    When you share photos and videos, they will appear on your profile.
                </p>
            </div>
        );
    }

    const handlePostClick = (post) => {
        setSelectedPost(post);
    };

    const closeModal = () => {
        setSelectedPost(null);
    };

    return (
        <>
            {/* Posts Grid */}
            <div className="grid grid-cols-3 gap-1 sm:gap-2 lg:gap-4">
                {posts.map((post) => {
                    const likesCount = Array.isArray(post.likes_count) ? post.likes_count.length : 0;
                    const commentsCount = post.comments_count || 0;
                    const hasMultipleImages = post.image_urls && post.image_urls.length > 1;
                    const firstImage = post.image_urls && post.image_urls.length > 0 ? post.image_urls[0] : null;

                    return (
                        <div
                            key={post._id}
                            className="relative aspect-square bg-gray-100 cursor-pointer group overflow-hidden"
                            onClick={() => handlePostClick(post)}
                        >
                            {firstImage ? (
                                <img
                                    src={firstImage}
                                    alt=""
                                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                    <div className="text-gray-400 text-center p-4">
                                        <div className="text-xs sm:text-sm font-medium">Text Post</div>
                                        <div className="text-xs mt-1 line-clamp-3 overflow-hidden">
                                            {post.content}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Multiple images indicator */}
                            {hasMultipleImages && (
                                <div className="absolute top-2 right-2">
                                    <div className="w-6 h-6 bg-black bg-opacity-60 rounded-full flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                            )}

                            {/* Hover overlay with stats */}
                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                                <div className="flex items-center space-x-4 sm:space-x-6 text-white">
                                    <div className="flex items-center space-x-1 sm:space-x-2">
                                        <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
                                        <span className="text-sm sm:text-base font-semibold">
                                            {likesCount}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-1 sm:space-x-2">
                                        <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
                                        <span className="text-sm sm:text-base font-semibold">
                                            {commentsCount}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Post Modal */}
            {selectedPost && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden">
                        {/* Close button */}
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 z-10 w-8 h-8 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-75 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Modal Content */}
                        <div className="bg-white rounded-lg overflow-hidden max-h-full">
                            <div className="max-h-[90vh] overflow-y-auto">
                                <PostCard post={selectedPost} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ProfilePostsGrid;
