import React, { useState, useEffect } from 'react'
import { BadgeCheck, Heart, MessageCircle, Share2, Plus, Bookmark } from 'lucide-react'
import moment from 'moment'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '@clerk/clerk-react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import InlineCommentsSection from './InlineCommentsSection'
import ShareModal from './ShareModal'
import ShareToStoryModal from './ShareToStoryModal'
import Avatar from './Avatar'
import LikedBy from './LikedBy'
import { toggleBookmark, updateBookmarkOptimistic } from '../features/bookmarks/bookmarksSlice'

const PostCard = ({post}) => {
    const dispatch = useDispatch();
    const postWithHashtags = post.content.replace(/(#\w+)/g, '<span class="text-blue-600">$1</span>')
    const [likes, setLikes] = useState(post.likes_count)
    const [commentsCount, setCommentsCount] = useState(post.comments_count || 0)
    const [sharesCount, setSharesCount] = useState(post.shares_count || 0)
    const [showShareModal, setShowShareModal] = useState(false)
    const [showShareToStoryModal, setShowShareToStoryModal] = useState(false)
    const [isLiking, setIsLiking] = useState(false)
    const [showComments, setShowComments] = useState(false)

    const currentUser = useSelector((state) => state.user.value)
    const bookmarkStatus = useSelector((state) => state.bookmarks.bookmarkStatus)
    const toggleLoading = useSelector((state) => state.bookmarks.toggleLoading)
    const { getToken } = useAuth()

    const isBookmarked = bookmarkStatus[post._id] || false
    const isToggling = toggleLoading[post._id] || false

    const handleLike = async () => {
        if (isLiking) return; // Prevent double clicks

        setIsLiking(true);

        // Check if currently liked (handle both string IDs and user objects)
        const wasLiked = Array.isArray(likes) && likes.some(like =>
            typeof like === 'string' ? like === currentUser._id : like._id === currentUser._id
        );

        // Optimistic update - keep current format
        const originalLikes = likes;
        if (typeof likes[0] === 'string') {
            // Legacy format - array of user IDs
            setLikes(prev => {
                if (prev.includes(currentUser._id)) {
                    return prev.filter(id => id !== currentUser._id)
                } else {
                    return [...prev, currentUser._id]
                }
            });
        } else {
            // New format - array of user objects
            setLikes(prev => {
                const userLikeIndex = prev.findIndex(like => like._id === currentUser._id);
                if (userLikeIndex !== -1) {
                    return prev.filter(like => like._id !== currentUser._id);
                } else {
                    return [{
                        _id: currentUser._id,
                        full_name: currentUser.full_name,
                        username: currentUser.username,
                        profile_picture: currentUser.profile_picture
                    }, ...prev];
                }
            });
        }

        try {
            const { data } = await api.post(`/api/post/like`,
                { postId: post._id },
                { headers: { Authorization: `Bearer ${await getToken()}` } }
            );

            if (data.success) {
                // Update with server response (should include populated user objects)
                if (data.likes) {
                    setLikes(data.likes);
                }
            } else {
                // Revert optimistic update on failure
                setLikes(originalLikes);
                toast.error(data.message || 'Failed to like post');
            }
        } catch (error) {
            // Revert optimistic update on error
            setLikes(originalLikes);
            toast.error(error.response?.data?.message || 'Failed to like post. Please try again.');
        } finally {
            setIsLiking(false);
        }
    }

    const handleShareClick = () => {
        setShowShareModal(true);
    }

    const handleBookmark = async () => {
        if (isToggling) return;

        try {
            // Optimistic update
            dispatch(updateBookmarkOptimistic({
                postId: post._id,
                isBookmarked: !isBookmarked
            }));

            const token = await getToken();
            await dispatch(toggleBookmark({
                postId: post._id,
                token
            })).unwrap();

            toast.success(isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks');
        } catch (error) {
            toast.error(error || 'Failed to update bookmark');
        }
    };

    const handleAddToStory = () => {
        setShowShareToStoryModal(true);
    }

    const navigate = useNavigate()

  return (
    <div className='bg-white w-full max-w-lg mx-auto lg:max-w-none lg:rounded-xl lg:shadow-sm lg:border border-gray-200'>
        {/* User Info Header - Instagram Style */}
        <div onClick={()=> navigate('/profile/' + post.user._id)} className='flex items-center justify-between p-3 sm:p-4 cursor-pointer hover:bg-gray-50 transition-colors'>
            <div className="flex items-center gap-3">
                <Avatar
                    src={post.user.profile_picture}
                    name={post.user.full_name}
                    size="md"
                />
                <div>
                    <div className='flex items-center gap-1'>
                        <span className='font-semibold text-gray-900 text-sm sm:text-base'>{post.user.username}</span>
                        <BadgeCheck className='w-4 h-4 text-blue-500'/>
                    </div>
                    <div className='text-gray-500 text-xs sm:text-sm'>{moment(post.createdAt).fromNow()}</div>
                </div>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <svg className="w-4 h-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
            </button>
        </div>

        {/* Post Image/Media - Instagram Style */}
        {post.image_urls.length > 0 && (
            <div className='relative w-full aspect-square lg:aspect-auto lg:max-h-96 bg-gray-100 overflow-hidden'>
                {post.image_urls.length === 1 ? (
                    <img
                        src={post.image_urls[0]}
                        className='w-full h-full object-cover lg:object-contain lg:bg-black'
                        alt=""
                    />
                ) : (
                    <div className='grid grid-cols-2 gap-0.5 w-full h-full'>
                        {post.image_urls.slice(0, 4).map((img, index) => (
                            <div key={index} className="relative overflow-hidden">
                                <img
                                    src={img}
                                    className='w-full h-full object-cover'
                                    alt=""
                                />
                                {index === 3 && post.image_urls.length > 4 && (
                                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                        <span className="text-white font-semibold text-lg">+{post.image_urls.length - 4}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* Action Buttons - Instagram Style */}
        <div className='p-3 sm:p-4 space-y-3'>
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                    <button
                        onClick={handleLike}
                        disabled={isLiking}
                        className={`transition-transform active:scale-125 ${
                            likes && likes.some(like =>
                                typeof like === 'string' ? like === currentUser._id : like._id === currentUser._id
                            ) ? 'text-red-500' : 'text-gray-900 hover:text-gray-600'
                        } ${isLiking ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                        <Heart className={`w-6 h-6 ${
                            likes && likes.some(like =>
                                typeof like === 'string' ? like === currentUser._id : like._id === currentUser._id
                            ) ? 'fill-red-500' : ''
                        }`} />
                    </button>

                    <button
                        onClick={() => setShowComments(!showComments)}
                        className='text-gray-900 hover:text-gray-600 transition-colors cursor-pointer'
                    >
                        <MessageCircle className="w-6 h-6"/>
                    </button>

                    <button
                        onClick={handleShareClick}
                        className='text-gray-900 hover:text-gray-600 transition-colors cursor-pointer'
                    >
                        <Share2 className="w-6 h-6"/>
                    </button>
                </div>

                <button
                    onClick={handleBookmark}
                    disabled={isToggling}
                    className={`transition-colors cursor-pointer ${isToggling ? 'opacity-50 cursor-not-allowed' : ''} ${
                        isBookmarked ? 'text-blue-600' : 'text-gray-900 hover:text-gray-600'
                    }`}
                    title={isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
                >
                    <Bookmark className={`w-6 h-6 ${isBookmarked ? 'fill-blue-600' : ''}`} />
                </button>
            </div>

            {/* Likes Count - Instagram Style */}
            {likes.length > 0 && (
                <LikedBy
                    likes={likes}
                    className=""
                />
            )}

            {/* Caption - Instagram Style */}
            {post.content && (
                <div className='text-sm sm:text-base leading-relaxed'>
                    <span className='font-semibold text-gray-900 mr-1'>{post.user.username}</span>
                    <span className='text-gray-900' dangerouslySetInnerHTML={{__html: postWithHashtags}}/>
                </div>
            )}

            {/* View Comments Link */}
            {!showComments && commentsCount > 0 && (
                <button
                    onClick={() => setShowComments(true)}
                    className="text-sm sm:text-base text-gray-500 hover:text-gray-700 transition-colors"
                >
                    View all {commentsCount} comments
                </button>
            )}

            {/* Inline Comments Section */}
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                showComments ? 'max-h-none opacity-100' : 'max-h-0 opacity-0'
            }`}>
                {showComments && (
                    <InlineCommentsSection
                        postId={post._id}
                        initialCommentsCount={commentsCount}
                        onHide={() => setShowComments(false)}
                    />
                )}
            </div>
        </div>

        {/* Share Modal */}
        <ShareModal
            postId={post._id}
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
        />

        {/* Share to Story Modal */}
        <ShareToStoryModal
            post={post}
            isOpen={showShareToStoryModal}
            onClose={() => setShowShareToStoryModal(false)}
        />

    </div>
  )
}

export default PostCard
