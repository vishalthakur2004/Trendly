import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

// Async thunks for API calls
export const fetchComments = createAsyncThunk(
    'comments/fetchComments',
    async ({ postId, page = 1, token }, { rejectWithValue }) => {
        try {
            const response = await api.get(`/api/comment/post/${postId}?page=${page}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                return { postId, comments: response.data.comments, page };
            } else {
                return rejectWithValue(response.data.message);
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to load comments');
        }
    }
);

export const addComment = createAsyncThunk(
    'comments/addComment',
    async ({ postId, content, parentCommentId, token }, { rejectWithValue }) => {
        try {
            const response = await api.post('/api/comment/add', {
                postId,
                content,
                parentCommentId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                return { postId, comment: response.data.comment, parentCommentId };
            } else {
                return rejectWithValue(response.data.message);
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to add comment');
        }
    }
);

export const likeComment = createAsyncThunk(
    'comments/likeComment',
    async ({ commentId, token }, { rejectWithValue }) => {
        try {
            const response = await api.post('/api/comment/like', {
                commentId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                return { commentId, message: response.data.message };
            } else {
                return rejectWithValue(response.data.message);
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to like comment');
        }
    }
);

export const deleteComment = createAsyncThunk(
    'comments/deleteComment',
    async ({ commentId, token }, { rejectWithValue }) => {
        try {
            const response = await api.delete('/api/comment/delete', {
                data: { commentId },
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                return { commentId };
            } else {
                return rejectWithValue(response.data.message);
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete comment');
        }
    }
);

export const fetchReplies = createAsyncThunk(
    'comments/fetchReplies',
    async ({ commentId, page = 1, token }, { rejectWithValue }) => {
        try {
            const response = await api.get(`/api/comment/replies/${commentId}?page=${page}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                return { commentId, replies: response.data.replies, page };
            } else {
                return rejectWithValue(response.data.message);
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to load replies');
        }
    }
);

const commentsSlice = createSlice({
    name: 'comments',
    initialState: {
        byPostId: {}, // { postId: { comments: [], loading: false, error: null } }
        replies: {}, // { commentId: { replies: [], loading: false, error: null } }
        loading: false,
        error: null,
    },
    reducers: {
        clearCommentsError: (state) => {
            state.error = null;
        },
        clearComments: (state, action) => {
            const { postId } = action.payload;
            if (postId) {
                delete state.byPostId[postId];
            } else {
                state.byPostId = {};
                state.replies = {};
            }
        },
        updateCommentLike: (state, action) => {
            const { commentId, userId, isLiked } = action.payload;
            
            // Update in main comments
            Object.keys(state.byPostId).forEach(postId => {
                const comment = state.byPostId[postId].comments.find(c => c._id === commentId);
                if (comment) {
                    if (isLiked) {
                        if (!comment.likes.includes(userId)) {
                            comment.likes.push(userId);
                        }
                    } else {
                        comment.likes = comment.likes.filter(id => id !== userId);
                    }
                }
                
                // Update in replies
                state.byPostId[postId].comments.forEach(comment => {
                    const reply = comment.replies?.find(r => r._id === commentId);
                    if (reply) {
                        if (isLiked) {
                            if (!reply.likes.includes(userId)) {
                                reply.likes.push(userId);
                            }
                        } else {
                            reply.likes = reply.likes.filter(id => id !== userId);
                        }
                    }
                });
            });
            
            // Update in replies state
            Object.keys(state.replies).forEach(parentCommentId => {
                const reply = state.replies[parentCommentId].replies.find(r => r._id === commentId);
                if (reply) {
                    if (isLiked) {
                        if (!reply.likes.includes(userId)) {
                            reply.likes.push(userId);
                        }
                    } else {
                        reply.likes = reply.likes.filter(id => id !== userId);
                    }
                }
            });
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Comments
            .addCase(fetchComments.pending, (state, action) => {
                const { postId } = action.meta.arg;
                if (!state.byPostId[postId]) {
                    state.byPostId[postId] = { comments: [], loading: false, error: null };
                }
                state.byPostId[postId].loading = true;
                state.byPostId[postId].error = null;
            })
            .addCase(fetchComments.fulfilled, (state, action) => {
                const { postId, comments } = action.payload;
                state.byPostId[postId].comments = comments;
                state.byPostId[postId].loading = false;
            })
            .addCase(fetchComments.rejected, (state, action) => {
                const { postId } = action.meta.arg;
                state.byPostId[postId].loading = false;
                state.byPostId[postId].error = action.payload;
            })
            
            // Add Comment
            .addCase(addComment.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addComment.fulfilled, (state, action) => {
                const { postId, comment, parentCommentId } = action.payload;
                state.loading = false;
                
                if (parentCommentId) {
                    // It's a reply - add to parent comment's replies
                    const parentComment = state.byPostId[postId]?.comments.find(c => c._id === parentCommentId);
                    if (parentComment) {
                        if (!parentComment.replies) parentComment.replies = [];
                        parentComment.replies.push(comment);
                        parentComment.replies_count = (parentComment.replies_count || 0) + 1;
                    }
                } else {
                    // It's a main comment
                    if (!state.byPostId[postId]) {
                        state.byPostId[postId] = { comments: [], loading: false, error: null };
                    }
                    state.byPostId[postId].comments.unshift(comment);
                }
            })
            .addCase(addComment.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            
            // Like Comment
            .addCase(likeComment.fulfilled, (state, action) => {
                // Handled by updateCommentLike reducer
            })
            
            // Delete Comment
            .addCase(deleteComment.fulfilled, (state, action) => {
                const { commentId } = action.payload;
                
                // Remove from all posts
                Object.keys(state.byPostId).forEach(postId => {
                    state.byPostId[postId].comments = state.byPostId[postId].comments.filter(c => c._id !== commentId);
                    
                    // Remove from replies
                    state.byPostId[postId].comments.forEach(comment => {
                        if (comment.replies) {
                            comment.replies = comment.replies.filter(r => r._id !== commentId);
                        }
                    });
                });
                
                // Remove from replies state
                Object.keys(state.replies).forEach(parentCommentId => {
                    state.replies[parentCommentId].replies = state.replies[parentCommentId].replies.filter(r => r._id !== commentId);
                });
            })
            
            // Fetch Replies
            .addCase(fetchReplies.pending, (state, action) => {
                const { commentId } = action.meta.arg;
                if (!state.replies[commentId]) {
                    state.replies[commentId] = { replies: [], loading: false, error: null };
                }
                state.replies[commentId].loading = true;
            })
            .addCase(fetchReplies.fulfilled, (state, action) => {
                const { commentId, replies } = action.payload;
                state.replies[commentId].replies = replies;
                state.replies[commentId].loading = false;
            })
            .addCase(fetchReplies.rejected, (state, action) => {
                const { commentId } = action.meta.arg;
                state.replies[commentId].loading = false;
                state.replies[commentId].error = action.payload;
            });
    }
});

export const { clearCommentsError, clearComments, updateCommentLike } = commentsSlice.actions;
export default commentsSlice.reducer;
