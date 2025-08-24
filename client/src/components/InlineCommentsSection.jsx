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

const InlineCommentsSection = ({ postId, initialCommentsCount = 0, onHide }) => {
    const dispatch = useDispatch();
    const { getToken } = useAuth();
    const currentUser = useSelector((state) => state.user.value);
    const commentsState = useSelector((state) => state.comments.byPostId[postId]);
    
    const [newComment, setNewComment] = useState('');
    const [showAllComments, setShowAllComments] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [isLoaded, setIsLoaded] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);

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
        if (!newComment.trim()) {
            toast.error('Please enter a comment');
            return;
        }

        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            const token = await getToken();
            await dispatch(addComment({
                postId,
                content: newComment.trim(),
                token
            })).unwrap();
            setNewComment('');
            // Don't show success toast for comments, it's too noisy
        } catch (error) {
            toast.error(error || 'Failed to add comment');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddReply = async (e, parentCommentId) => {
        e.preventDefault();
        if (!replyText.trim()) {
            toast.error('Please enter a reply');
            return;
        }

        if (isSubmittingReply) return;

        setIsSubmittingReply(true);
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
            // Don't show success toast for replies, it's too noisy
        } catch (error) {
            toast.error(error || 'Failed to add reply');
        } finally {
            setIsSubmittingReply(false);
        }
    };

    const handleLikeComment = async (commentId) => {
        try {
            const comment = findCommentById(commentId);
            if (!comment) {
                toast.error('Comment not found');
                return;
            }

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
            // Revert optimistic update on error
            const comment = findCommentById(commentId);
            const wasLiked = comment?.likes?.includes(currentUser._id);
            dispatch(updateCommentLike({
                commentId,
                userId: currentUser._id,
                isLiked: !wasLiked
            }));
            toast.error(error || 'Failed to update like');
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Are you sure you want to delete this comment?')) {
            return;
        }

        try {
            const token = await getToken();
            await dispatch(deleteComment({ commentId, token })).unwrap();
            toast.success('Comment deleted');
        } catch (error) {
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
        const canDelete = comment.user._id === currentUser._id;
        const [showMenu, setShowMenu] = useState(false);

        return (
            <div className={`${isReply ? 'ml-6 mt-1' : 'mt-2'} ${isCompact ? 'py-1' : 'py-2'} group`}>
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
                                            className="text-xs text-gray-500 font-medium hover:text-gray-700 transition-colors"
                                        >
                                            {replyingTo === comment._id ? 'Cancel' : 'Reply'}
                                        </button>
                                    )}

                                    {canDelete && (
                                        <button
                                            onClick={() => handleDeleteComment(comment._id)}
                                            className="text-xs text-gray-500 font-medium hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handleLikeComment(comment._id)}
                                    className={`flex-shrink-0 p-1 ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'} transition-colors`}
                                >
                                    <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
                                </button>
                            </div>
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
                                            className="flex-1 px-3 py-1 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                                            autoFocus
                                            disabled={isSubmittingReply}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleAddReply(e, comment._id);
                                                } else if (e.key === 'Escape') {
                                                    setReplyingTo(null);
                                                    setReplyText('');
                                                }
                                            }}
                                        />
                                        <button
                                            type="submit"
                                            disabled={!replyText.trim() || isSubmittingReply}
                                            className="text-blue-500 hover:text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {isSubmittingReply ? (
                                                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                                            ) : (
                                                <Send className="w-4 h-4" />
                                            )}
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
            {/* Comments Header with Hide Option */}
            <div className="flex items-center justify-between mb-2">
                <div>
                    {totalComments > 0 && (
                        <div>
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
                </div>
                {onHide && (
                    <button
                        onClick={onHide}
                        className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                    >
                        Hide
                    </button>
                )}
            </div>
            
            {/* Comments List */}
            {commentsState?.loading && !comments.length ? (
                <div className="text-sm text-gray-500 py-2 flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                    Loading comments...
                </div>
            ) : commentsState?.error ? (
                <div className="text-sm text-red-500 py-2 bg-red-50 px-3 rounded-lg">
                    {commentsState.error}
                    <button
                        onClick={() => loadComments()}
                        className="ml-2 text-blue-500 hover:text-blue-700 underline"
                    >
                        Try again
                    </button>
                </div>
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
                            className="flex-1 px-3 py-1 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                            disabled={isSubmitting}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddComment(e);
                                } else if (e.key === 'Escape') {
                                    setNewComment('');
                                }
                            }}
                        />
                        <button
                            type="submit"
                            disabled={!newComment.trim() || isSubmitting}
                            className="text-blue-500 hover:text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSubmitting ? (
                                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default InlineCommentsSection;
