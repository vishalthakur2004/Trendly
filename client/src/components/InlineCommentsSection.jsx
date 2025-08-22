import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, MessageCircle, Send, Trash2, MoreHorizontal } from 'lucide-react';
import moment from 'moment';
import toast from 'react-hot-toast';
import { useAuth } from '@clerk/clerk-react';
import {
    fetchComments,
    addComment,
    likeComment,
    deleteComment,
    updateCommentLike
} from '../features/comments/commentsSlice';

const InlineCommentsSection = ({ postId, initialCommentsCount = 0 }) => {
    const dispatch = useDispatch();
    const { getToken } = useAuth();
    const currentUser = useSelector((state) => state.user.value);
    const commentsState = useSelector((state) => state.comments.byPostId[postId]);
    
    const [newComment, setNewComment] = useState('');
    const [showAllComments, setShowAllComments] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [isLoaded, setIsLoaded] = useState(false);

    // Load comments when component mounts or when toggling to show all
    useEffect(() => {
        if (!isLoaded || (showAllComments && !commentsState)) {
            loadComments();
            setIsLoaded(true);
        }
    }, [showAllComments, isLoaded]);

    const loadComments = async () => {
        try {
            const token = await getToken();
            dispatch(fetchComments({ postId, token }));
        } catch (error) {
            console.error('Error loading comments:', error);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            const token = await getToken();
            await dispatch(addComment({
                postId,
                content: newComment.trim(),
                token
            })).unwrap();
            setNewComment('');
        } catch (error) {
            toast.error(error);
        }
    };

    const handleAddReply = async (e, parentCommentId) => {
        e.preventDefault();
        if (!replyText.trim()) return;

        try {
            const token = await getToken();
            await dispatch(addComment({
                postId,
                content: replyText.trim(),
                parentCommentId,
                token
            })).unwrap();
            setReplyText('');
            setReplyingTo(null);
        } catch (error) {
            toast.error(error);
        }
    };

    const handleLikeComment = async (commentId) => {
        try {
            const comment = findCommentById(commentId);
            const isLiked = comment?.likes?.includes(currentUser._id);

            // Optimistic update
            dispatch(updateCommentLike({
                commentId,
                userId: currentUser._id,
                isLiked: !isLiked
            }));

            const token = await getToken();
            await dispatch(likeComment({ commentId, token })).unwrap();
        } catch (error) {
            // Revert optimistic update
            const comment = findCommentById(commentId);
            const isLiked = comment?.likes?.includes(currentUser._id);
            dispatch(updateCommentLike({
                commentId,
                userId: currentUser._id,
                isLiked: !isLiked
            }));
            toast.error(error);
        }
    };

    const findCommentById = (commentId) => {
        if (!commentsState?.comments) return null;
        
        for (const comment of commentsState.comments) {
            if (comment._id === commentId) return comment;
            if (comment.replies) {
                const reply = comment.replies.find(r => r._id === commentId);
                if (reply) return reply;
            }
        }
        return null;
    };

    const CommentItem = ({ comment, isReply = false, isCompact = false }) => {
        const isLiked = comment.likes?.includes(currentUser._id);
        const likesCount = comment.likes?.length || 0;

        return (
            <div className={`${isReply ? 'ml-6 mt-1' : 'mt-2'} ${isCompact ? 'py-1' : 'py-2'}`}>
                <div className="flex gap-3">
                    {!isCompact && (
                        <img 
                            src={comment.user.profile_picture} 
                            alt={comment.user.full_name}
                            className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                        />
                    )}
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                            <div className="flex-1">
                                <div className="inline">
                                    <span className="font-medium text-sm text-gray-900">
                                        {comment.user.full_name}
                                    </span>
                                    <span className="text-sm text-gray-800 ml-2">
                                        {comment.content}
                                    </span>
                                </div>
                                
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-xs text-gray-500">
                                        {moment(comment.createdAt).fromNow()}
                                    </span>
                                    
                                    {likesCount > 0 && (
                                        <span className="text-xs text-gray-500 font-medium">
                                            {likesCount} {likesCount === 1 ? 'like' : 'likes'}
                                        </span>
                                    )}
                                    
                                    {!isReply && (
                                        <button 
                                            onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                                            className="text-xs text-gray-500 font-medium hover:text-gray-700"
                                        >
                                            Reply
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => handleLikeComment(comment._id)}
                                className={`flex-shrink-0 p-1 ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'} transition-colors`}
                            >
                                <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
                            </button>
                        </div>
                        
                        {/* Reply Form */}
                        {replyingTo === comment._id && (
                            <form onSubmit={(e) => handleAddReply(e, comment._id)} className="mt-2">
                                <div className="flex gap-2">
                                    <img 
                                        src={currentUser?.profile_picture} 
                                        alt={currentUser?.full_name}
                                        className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                                    />
                                    <div className="flex-1 flex gap-2">
                                        <input
                                            type="text"
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder="Write a reply..."
                                            className="flex-1 px-3 py-1 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            autoFocus
                                        />
                                        <button 
                                            type="submit"
                                            disabled={!replyText.trim()}
                                            className="text-blue-500 hover:text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}
                        
                        {/* Replies */}
                        {!isReply && comment.replies && comment.replies.length > 0 && (
                            <div className="mt-2">
                                {comment.replies.slice(0, showAllComments ? undefined : 2).map(reply => (
                                    <CommentItem 
                                        key={reply._id} 
                                        comment={reply} 
                                        isReply={true}
                                        isCompact={!showAllComments}
                                    />
                                ))}
                                
                                {!showAllComments && comment.replies.length > 2 && (
                                    <button 
                                        onClick={() => setShowAllComments(true)}
                                        className="text-xs text-gray-500 hover:text-gray-700 ml-6 mt-1"
                                    >
                                        View {comment.replies.length - 2} more replies
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const comments = commentsState?.comments || [];
    const totalComments = initialCommentsCount || comments.length;
    const displayComments = showAllComments ? comments : comments.slice(0, 3);
    const hasMoreComments = !showAllComments && comments.length > 3;

    return (
        <div className="mt-2">
            {/* Comments Count & View All Link */}
            {totalComments > 0 && (
                <div className="mb-2">
                    {hasMoreComments ? (
                        <button 
                            onClick={() => setShowAllComments(true)}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            View all {totalComments} comments
                        </button>
                    ) : showAllComments && comments.length > 3 && (
                        <button 
                            onClick={() => setShowAllComments(false)}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Hide comments
                        </button>
                    )}
                </div>
            )}
            
            {/* Comments List */}
            {commentsState?.loading && !comments.length ? (
                <div className="text-sm text-gray-500 py-2">Loading comments...</div>
            ) : commentsState?.error ? (
                <div className="text-sm text-red-500 py-2">{commentsState.error}</div>
            ) : (
                <div>
                    {displayComments.map(comment => (
                        <CommentItem 
                            key={comment._id} 
                            comment={comment}
                            isCompact={!showAllComments && comments.length > 3}
                        />
                    ))}
                </div>
            )}
            
            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="mt-3">
                <div className="flex gap-3">
                    <img 
                        src={currentUser?.profile_picture} 
                        alt={currentUser?.full_name}
                        className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 flex gap-2">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="flex-1 px-3 py-1 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button 
                            type="submit"
                            disabled={!newComment.trim()}
                            className="text-blue-500 hover:text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default InlineCommentsSection;
