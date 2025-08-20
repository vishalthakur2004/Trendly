import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, MessageCircle, Trash2, Send } from 'lucide-react';
import moment from 'moment';
import toast from 'react-hot-toast';
import { useAuth } from '@clerk/clerk-react';
import { 
    fetchComments, 
    addComment, 
    likeComment, 
    deleteComment,
    fetchReplies,
    updateCommentLike 
} from '../features/comments/commentsSlice';

const CommentsSection = ({ postId, isOpen, onClose }) => {
    const dispatch = useDispatch();
    const { getToken } = useAuth();
    const currentUser = useSelector((state) => state.user.value);
    const commentsState = useSelector((state) => state.comments.byPostId[postId]);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [showReplies, setShowReplies] = useState({});

    useEffect(() => {
        if (isOpen && postId && !commentsState) {
            dispatch(fetchComments({ postId }));
        }
    }, [isOpen, postId, dispatch, commentsState]);

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            await dispatch(addComment({ 
                postId, 
                content: newComment.trim() 
            })).unwrap();
            setNewComment('');
            toast.success('Comment added successfully');
        } catch (error) {
            toast.error(error);
        }
    };

    const handleAddReply = async (e, parentCommentId) => {
        e.preventDefault();
        if (!replyText.trim()) return;

        try {
            await dispatch(addComment({ 
                postId, 
                content: replyText.trim(),
                parentCommentId 
            })).unwrap();
            setReplyText('');
            setReplyingTo(null);
            toast.success('Reply added successfully');
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

            await dispatch(likeComment({ commentId })).unwrap();
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

    const handleDeleteComment = async (commentId) => {
        if (window.confirm('Are you sure you want to delete this comment?')) {
            try {
                await dispatch(deleteComment({ commentId })).unwrap();
                toast.success('Comment deleted successfully');
            } catch (error) {
                toast.error(error);
            }
        }
    };

    const toggleReplies = (commentId) => {
        setShowReplies(prev => ({
            ...prev,
            [commentId]: !prev[commentId]
        }));
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

    const CommentItem = ({ comment, isReply = false }) => {
        const isLiked = comment.likes?.includes(currentUser._id);
        const canDelete = comment.user._id === currentUser._id;

        return (
            <div className={`${isReply ? 'ml-8 border-l-2 border-gray-100 pl-4' : ''} py-3`}>
                <div className="flex gap-3">
                    <img 
                        src={comment.user.profile_picture} 
                        alt={comment.user.full_name}
                        className="w-8 h-8 rounded-full object-cover"
                    />
                    
                    <div className="flex-1">
                        <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{comment.user.full_name}</span>
                                <span className="text-gray-500 text-xs">
                                    @{comment.user.username}
                                </span>
                                <span className="text-gray-400 text-xs">
                                    {moment(comment.createdAt).fromNow()}
                                </span>
                            </div>
                            <p className="text-sm text-gray-800">{comment.content}</p>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <button 
                                onClick={() => handleLikeComment(comment._id)}
                                className={`flex items-center gap-1 hover:text-red-500 transition-colors ${
                                    isLiked ? 'text-red-500' : ''
                                }`}
                            >
                                <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
                                <span>{comment.likes?.length || 0}</span>
                            </button>
                            
                            {!isReply && (
                                <button 
                                    onClick={() => setReplyingTo(comment._id)}
                                    className="flex items-center gap-1 hover:text-blue-500 transition-colors"
                                >
                                    <MessageCircle className="w-3 h-3" />
                                    Reply
                                </button>
                            )}
                            
                            {canDelete && (
                                <button 
                                    onClick={() => handleDeleteComment(comment._id)}
                                    className="flex items-center gap-1 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="w-3 h-3" />
                                    Delete
                                </button>
                            )}
                        </div>
                        
                        {/* Reply Form */}
                        {replyingTo === comment._id && (
                            <form onSubmit={(e) => handleAddReply(e, comment._id)} className="mt-3">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Write a reply..."
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        autoFocus
                                    />
                                    <button 
                                        type="submit"
                                        disabled={!replyText.trim()}
                                        className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setReplyingTo(null)}
                                        className="px-3 py-2 text-gray-500 hover:text-gray-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}
                        
                        {/* Replies */}
                        {!isReply && comment.replies_count > 0 && (
                            <div className="mt-3">
                                <button 
                                    onClick={() => toggleReplies(comment._id)}
                                    className="text-xs text-blue-500 hover:underline"
                                >
                                    {showReplies[comment._id] ? 'Hide' : 'Show'} {comment.replies_count} {comment.replies_count === 1 ? 'reply' : 'replies'}
                                </button>
                                
                                {showReplies[comment._id] && comment.replies && (
                                    <div className="mt-2">
                                        {comment.replies.map(reply => (
                                            <CommentItem 
                                                key={reply._id} 
                                                comment={reply} 
                                                isReply={true} 
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold">Comments</h3>
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-xl"
                    >
                        ×
                    </button>
                </div>
                
                {/* Comments List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {commentsState?.loading ? (
                        <div className="text-center py-8 text-gray-500">Loading comments...</div>
                    ) : commentsState?.error ? (
                        <div className="text-center py-8 text-red-500">{commentsState.error}</div>
                    ) : !commentsState?.comments?.length ? (
                        <div className="text-center py-8 text-gray-500">
                            No comments yet. Be the first to comment!
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {commentsState.comments.map(comment => (
                                <CommentItem key={comment._id} comment={comment} />
                            ))}
                        </div>
                    )}
                </div>
                
                {/* Add Comment Form */}
                <div className="p-4 border-t border-gray-200">
                    <form onSubmit={handleAddComment} className="flex gap-3">
                        <img 
                            src={currentUser?.profile_picture} 
                            alt={currentUser?.full_name}
                            className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1 flex gap-2">
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Write a comment..."
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button 
                                type="submit"
                                disabled={!newComment.trim()}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CommentsSection;
