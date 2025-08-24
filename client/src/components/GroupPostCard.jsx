import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '@clerk/clerk-react';
import {
    Heart,
    MessageCircle,
    Pin,
    MoreVertical,
    Edit3,
    Trash2,
    CheckCircle,
    XCircle,
    Clock
} from 'lucide-react';
import moment from 'moment';
import toast from 'react-hot-toast';
import {
    toggleLikeGroupPost,
    togglePinPost,
    deleteGroupPost,
    moderatePost
} from '../features/groups/groupPostsSlice';
import InlineCommentsSection from './InlineCommentsSection';
import LikedBy from './LikedBy';

const GroupPostCard = ({ post, groupId, canModerate = false }) => {
    const dispatch = useDispatch();
    const { getToken } = useAuth();
    const currentUser = useSelector(state => state.user.value);
    
    const [showMenu, setShowMenu] = useState(false);
    const [isLiking, setIsLiking] = useState(false);
    const [showComments, setShowComments] = useState(false);

    const isLiked = post.likes_count?.includes(currentUser?._id);
    const isAuthor = post.user?._id === currentUser?._id;

    const handleLike = async () => {
        if (isLiking) return;
        
        setIsLiking(true);
        try {
            const token = await getToken();
            await dispatch(toggleLikeGroupPost({ 
                groupId, 
                postId: post._id, 
                token 
            })).unwrap();
        } catch (error) {
            toast.error('Failed to update like');
        } finally {
            setIsLiking(false);
        }
    };

    const handlePin = async () => {
        try {
            const token = await getToken();
            await dispatch(togglePinPost({ 
                groupId, 
                postId: post._id, 
                token 
            })).unwrap();
            toast.success(post.is_pinned ? 'Post unpinned' : 'Post pinned');
            setShowMenu(false);
        } catch (error) {
            toast.error('Failed to update pin status');
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            try {
                const token = await getToken();
                await dispatch(deleteGroupPost({ 
                    groupId, 
                    postId: post._id, 
                    token 
                })).unwrap();
                toast.success('Post deleted');
                setShowMenu(false);
            } catch (error) {
                toast.error('Failed to delete post');
            }
        }
    };

    const handleModerate = async (action) => {
        try {
            const token = await getToken();
            await dispatch(moderatePost({ 
                groupId, 
                postId: post._id, 
                action, 
                token 
            })).unwrap();
            toast.success(`Post ${action}d`);
            setShowMenu(false);
        } catch (error) {
            toast.error(`Failed to ${action} post`);
        }
    };

    const getApprovalStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'text-green-600';
            case 'pending': return 'text-yellow-600';
            case 'rejected': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <div className={`bg-white rounded-lg shadow-sm border border-gray-100 p-4 ${
            post.is_pinned ? 'border-blue-200 bg-blue-50' : ''
        }`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <img 
                        src={post.user?.profile_picture} 
                        alt={post.user?.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900">{post.user?.full_name}</h4>
                            {post.is_pinned && (
                                <Pin className="w-4 h-4 text-blue-500" />
                            )}
                            {post.is_announcement && (
                                <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-600 rounded-full">
                                    Announcement
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{moment(post.createdAt).fromNow()}</span>
                            {post.edited && (
                                <span className="text-xs">(edited)</span>
                            )}
                            {post.approval_status !== 'approved' && (
                                <span className={`text-xs ${getApprovalStatusColor(post.approval_status)}`}>
                                    {post.approval_status}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Menu */}
                {(isAuthor || canModerate) && (
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {showMenu && (
                            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-32">
                                {canModerate && (
                                    <>
                                        <button
                                            onClick={handlePin}
                                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                        >
                                            <Pin className="w-4 h-4" />
                                            {post.is_pinned ? 'Unpin' : 'Pin'}
                                        </button>
                                        
                                        {post.approval_status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleModerate('approve')}
                                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-green-600"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleModerate('reject')}
                                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                    </>
                                )}
                                
                                {(isAuthor || canModerate) && (
                                    <button
                                        onClick={handleDelete}
                                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Content */}
            {post.content && (
                <div className="mb-3">
                    <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
                </div>
            )}

            {/* Images */}
            {post.image_urls && post.image_urls.length > 0 && (
                <div className="mb-3">
                    <div className={`grid gap-2 ${
                        post.image_urls.length === 1 ? 'grid-cols-1' : 
                        post.image_urls.length === 2 ? 'grid-cols-2' : 
                        'grid-cols-2 md:grid-cols-3'
                    }`}>
                        {post.image_urls.map((url, index) => (
                            <img 
                                key={index}
                                src={url} 
                                alt={`Post image ${index + 1}`}
                                className="rounded-lg object-cover w-full h-48"
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Poll */}
            {post.post_type === 'poll' && post.poll_data && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-3">{post.poll_data.question}</h4>
                    <div className="space-y-2">
                        {post.poll_data.options.map((option, index) => {
                            const totalVotes = post.poll_data.options.reduce((sum, opt) => sum + opt.votes.length, 0);
                            const percentage = totalVotes > 0 ? (option.votes.length / totalVotes) * 100 : 0;
                            const hasVoted = option.votes.includes(currentUser?._id);
                            
                            return (
                                <div key={index} className="relative">
                                    <div className={`p-2 rounded border cursor-pointer transition-colors ${
                                        hasVoted ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                                    }`}>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">{option.option_text}</span>
                                            <span className="text-xs text-gray-500">
                                                {option.votes.length} votes ({percentage.toFixed(1)}%)
                                            </span>
                                        </div>
                                        <div className="mt-1 bg-gray-200 rounded-full h-1">
                                            <div 
                                                className="bg-blue-500 h-1 rounded-full transition-all"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    {post.poll_data.expires_at && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>Expires {moment(post.poll_data.expires_at).fromNow()}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                <button
                    onClick={handleLike}
                    disabled={isLiking}
                    className={`flex items-center gap-1 hover:text-red-500 transition-colors ${
                        isLiked ? 'text-red-500' : 'text-gray-600'
                    } ${isLiking ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500' : ''}`} />
                </button>

                <button
                    onClick={() => setShowComments(!showComments)}
                    className={`flex items-center gap-1 transition-colors cursor-pointer ${
                        showComments ? 'text-blue-500' : 'text-gray-600 hover:text-blue-500'
                    }`}
                    title={showComments ? 'Hide comments' : 'View comments'}
                >
                    <MessageCircle className={`w-4 h-4 ${showComments ? 'fill-blue-500' : ''}`}/>
                    {(post.comments_count || 0) > 0 && !showComments && (
                        <span className="text-xs bg-blue-500 text-white rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                            {(post.comments_count || 0) > 99 ? '99+' : (post.comments_count || 0)}
                        </span>
                    )}
                </button>
            </div>

            {/* Liked By Section - Instagram style */}
            {post.likes_count && post.likes_count.length > 0 && (
                <LikedBy
                    likes={post.likes_count}
                    className="px-1 mt-1"
                />
            )}

            {/* View Comments Link */}
            {!showComments && (post.comments_count || 0) > 0 && (
                <button
                    onClick={() => setShowComments(true)}
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors px-1 mt-2"
                >
                    View all {post.comments_count} comments
                </button>
            )}

            {/* Inline Comments Section */}
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                showComments ? 'max-h-none opacity-100' : 'max-h-0 opacity-0'
            }`}>
                {showComments && (
                    <InlineCommentsSection
                        postId={post._id}
                        initialCommentsCount={post.comments_count || 0}
                        onHide={() => setShowComments(false)}
                    />
                )}
            </div>
        </div>
    );
};

export default GroupPostCard;
