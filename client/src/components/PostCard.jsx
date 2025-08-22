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

const PostCard = ({post}) => {

    const postWithHashtags = post.content.replace(/(#\w+)/g, '<span class="text-indigo-600">$1</span>')
    const [likes, setLikes] = useState(post.likes_count)
    const [commentsCount, setCommentsCount] = useState(post.comments_count || 0)
    const [sharesCount, setSharesCount] = useState(post.shares_count || 0)
    const [showShareModal, setShowShareModal] = useState(false)
    const [showShareToStoryModal, setShowShareToStoryModal] = useState(false)
    const [isLiking, setIsLiking] = useState(false)

    const currentUser = useSelector((state) => state.user.value)
    const { getToken } = useAuth()

    const handleLike = async () => {
        if (isLiking) return; // Prevent double clicks

        setIsLiking(true);
        const wasLiked = likes.includes(currentUser._id);

        // Optimistic update
        setLikes(prev => {
            if (prev.includes(currentUser._id)) {
                return prev.filter(id => id !== currentUser._id)
            } else {
                return [...prev, currentUser._id]
            }
        });

        try {
            const { data } = await api.post(`/api/post/like`,
                { postId: post._id },
                { headers: { Authorization: `Bearer ${await getToken()}` } }
            );

            if (!data.success) {
                // Revert optimistic update on failure
                setLikes(prev => {
                    if (wasLiked) {
                        return [...prev, currentUser._id]
                    } else {
                        return prev.filter(id => id !== currentUser._id)
                    }
                });
                toast.error(data.message || 'Failed to like post');
            }
        } catch (error) {
            // Revert optimistic update on error
            setLikes(prev => {
                if (wasLiked) {
                    return [...prev, currentUser._id]
                } else {
                    return prev.filter(id => id !== currentUser._id)
                }
            });
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
        <div onClick={()=> navigate('/profile/' + post.user._id)} className='inline-flex items-center gap-3 cursor-pointer'>
            <img src={post.user.profile_picture} alt="" className='w-10 h-10 rounded-full shadow'/>
            <div>
                <div className='flex items-center space-x-1'>
                    <span>{post.user.full_name}</span>
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
                    likes.includes(currentUser._id) ? 'text-red-500' : ''
                } ${isLiking ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
                <Heart className={`w-4 h-4 ${likes.includes(currentUser._id) ? 'fill-red-500' : ''}`} />
                <span>{likes.length}</span>
            </button>

            <button
                onClick={handleCommentsClick}
                className='flex items-center gap-1 hover:text-blue-500 transition-colors cursor-pointer'
            >
                <MessageCircle className="w-4 h-4"/>
                <span>{commentsCount}</span>
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

        {/* Comments Section Modal */}
        <CommentsSection
            postId={post._id}
            isOpen={showComments}
            onClose={() => setShowComments(false)}
        />

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
