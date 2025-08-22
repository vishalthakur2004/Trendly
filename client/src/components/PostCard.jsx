import React, { useState } from 'react'
import { BadgeCheck, Heart, MessageCircle, Share2, Plus } from 'lucide-react'
import moment from 'moment'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux';
import { useAuth } from '@clerk/clerk-react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import InlineCommentsSection from './InlineCommentsSection'
import ShareModal from './ShareModal'
import ShareToStoryModal from './ShareToStoryModal'
import Avatar from './Avatar'
import LikedBy from './LikedBy'

const PostCard = ({post}) => {

    const postWithHashtags = post.content.replace(/(#\w+)/g, '<span class="text-indigo-600">$1</span>')
    const [likes, setLikes] = useState(post.likes_count)
    const [commentsCount, setCommentsCount] = useState(post.comments_count || 0)
    const [sharesCount, setSharesCount] = useState(post.shares_count || 0)
    const [showShareModal, setShowShareModal] = useState(false)
    const [showShareToStoryModal, setShowShareToStoryModal] = useState(false)
    const [isLiking, setIsLiking] = useState(false)
    const [showComments, setShowComments] = useState(false)

    const currentUser = useSelector((state) => state.user.value)
    const { getToken } = useAuth()

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

    const handleAddToStory = () => {
        setShowShareToStoryModal(true);
    }

    const navigate = useNavigate()

  return (
    <div className='bg-white rounded-xl shadow p-4 space-y-4 w-full max-w-2xl'>
        {/* User Info */}
        <div onClick={()=> navigate('/profile/' + post.user._id)} className='inline-flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded-lg transition-colors'>
            <Avatar
                src={post.user.profile_picture}
                name={post.user.full_name}
                size="md"
            />
            <div>
                <div className='flex items-center space-x-1'>
                    <span className='font-semibold text-gray-900'>{post.user.full_name}</span>
                    <BadgeCheck className='w-4 h-4 text-blue-500'/>
                </div>
                <div className='text-gray-500 text-sm'>@{post.user.username} • {moment(post.createdAt).fromNow()}</div>
            </div>
        </div>
         {/* Content */}
         {post.content && <div className='text-gray-800 text-sm whitespace-pre-line' dangerouslySetInnerHTML={{__html: postWithHashtags}}/>}

       {/* Images */}
       <div className='grid grid-cols-2 gap-2'>
            {post.image_urls.map((img, index)=>(
                <img src={img} key={index} className={`w-full h-48 object-cover rounded-lg ${post.image_urls.length === 1 && 'col-span-2 h-auto'}`} alt="" />
            ))}
       </div>

        {/* Actions */}
        <div className='flex items-center gap-4 text-gray-600 text-sm pt-2 border-t border-gray-300'>
            <button
                onClick={handleLike}
                disabled={isLiking}
                className={`flex items-center gap-1 hover:text-red-500 transition-colors ${
                    likes && likes.some(like =>
                        typeof like === 'string' ? like === currentUser._id : like._id === currentUser._id
                    ) ? 'text-red-500' : ''
                } ${isLiking ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
                <Heart className={`w-4 h-4 ${
                    likes && likes.some(like =>
                        typeof like === 'string' ? like === currentUser._id : like._id === currentUser._id
                    ) ? 'fill-red-500' : ''
                }`} />
            </button>

            <button
                onClick={() => setShowComments(!showComments)}
                className={`flex items-center gap-1 transition-colors cursor-pointer ${
                    showComments ? 'text-blue-500' : 'text-gray-600 hover:text-blue-500'
                }`}
                title={showComments ? 'Hide comments' : 'View comments'}
            >
                <MessageCircle className={`w-4 h-4 ${showComments ? 'fill-blue-500' : ''}`}/>
                {commentsCount > 0 && !showComments && (
                    <span className="text-xs bg-blue-500 text-white rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                        {commentsCount > 99 ? '99+' : commentsCount}
                    </span>
                )}
            </button>

            <button
                onClick={handleShareClick}
                className='flex items-center gap-1 hover:text-green-500 transition-colors cursor-pointer'
            >
                <Share2 className="w-4 h-4"/>
                <span>{sharesCount}</span>
            </button>

            <button
                onClick={handleAddToStory}
                className='flex items-center gap-1 hover:text-purple-500 transition-colors cursor-pointer ml-auto'
                title="Add to Story"
            >
                <Plus className="w-4 h-4"/>
                <span className="text-xs">Story</span>
            </button>
        </div>

        {/* Liked By Section */}
        {likes.length > 0 && (
            <LikedBy
                likes={likes}
                className="px-1 -mt-2"
            />
        )}

        {/* View Comments Link */}
        {!showComments && commentsCount > 0 && (
            <button
                onClick={() => setShowComments(true)}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors px-1"
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
                />
            )}
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
