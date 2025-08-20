import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

// Async thunks for group posts
export const createGroupPost = createAsyncThunk(
    'groupPosts/createGroupPost',
    async ({ groupId, postData, token }, { rejectWithValue }) => {
        try {
            const response = await api.post(`/api/group/${groupId}/posts`, postData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                return response.data.post;
            } else {
                return rejectWithValue(response.data.message);
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create post');
        }
    }
);

export const getGroupPosts = createAsyncThunk(
    'groupPosts/getGroupPosts',
    async ({ groupId, page = 1, limit = 20, filter = 'all', token }, { rejectWithValue }) => {
        try {
            const response = await api.get(`/api/group/${groupId}/posts?page=${page}&limit=${limit}&filter=${filter}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                return { ...response.data, groupId };
            } else {
                return rejectWithValue(response.data.message);
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch posts');
        }
    }
);

export const getPendingPosts = createAsyncThunk(
    'groupPosts/getPendingPosts',
    async ({ groupId, token }, { rejectWithValue }) => {
        try {
            const response = await api.get(`/api/group/${groupId}/posts/pending`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                return response.data.posts;
            } else {
                return rejectWithValue(response.data.message);
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch pending posts');
        }
    }
);

export const moderatePost = createAsyncThunk(
    'groupPosts/moderatePost',
    async ({ groupId, postId, action, token }, { rejectWithValue }) => {
        try {
            const response = await api.post(`/api/group/${groupId}/posts/${postId}/moderate`, {
                action
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                return { postId, action };
            } else {
                return rejectWithValue(response.data.message);
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to moderate post');
        }
    }
);

export const toggleLikeGroupPost = createAsyncThunk(
    'groupPosts/toggleLikeGroupPost',
    async ({ groupId, postId, token }, { rejectWithValue }) => {
        try {
            const response = await api.post(`/api/group/${groupId}/posts/${postId}/like`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                return { 
                    postId, 
                    isLiked: response.data.isLiked, 
                    likesCount: response.data.likesCount 
                };
            } else {
                return rejectWithValue(response.data.message);
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to toggle like');
        }
    }
);

export const togglePinPost = createAsyncThunk(
    'groupPosts/togglePinPost',
    async ({ groupId, postId, token }, { rejectWithValue }) => {
        try {
            const response = await api.post(`/api/group/${groupId}/posts/${postId}/pin`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                return { postId, isPinned: response.data.isPinned };
            } else {
                return rejectWithValue(response.data.message);
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to toggle pin');
        }
    }
);

export const deleteGroupPost = createAsyncThunk(
    'groupPosts/deleteGroupPost',
    async ({ groupId, postId, token }, { rejectWithValue }) => {
        try {
            const response = await api.delete(`/api/group/${groupId}/posts/${postId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                return postId;
            } else {
                return rejectWithValue(response.data.message);
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete post');
        }
    }
);

export const voteOnPoll = createAsyncThunk(
    'groupPosts/voteOnPoll',
    async ({ groupId, postId, optionIndex, token }, { rejectWithValue }) => {
        try {
            const response = await api.post(`/api/group/${groupId}/posts/${postId}/vote`, {
                optionIndex
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                return { postId, poll_data: response.data.poll_data };
            } else {
                return rejectWithValue(response.data.message);
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to vote');
        }
    }
);

const groupPostsSlice = createSlice({
    name: 'groupPosts',
    initialState: {
        posts: {},  // groupId -> posts array
        pendingPosts: {},  // groupId -> pending posts array
        loading: false,
        error: null,
        pagination: {} // groupId -> pagination info
    },
    reducers: {
        clearGroupPostsError: (state) => {
            state.error = null;
        },
        clearGroupPosts: (state, action) => {
            const groupId = action.payload;
            if (groupId) {
                delete state.posts[groupId];
                delete state.pendingPosts[groupId];
                delete state.pagination[groupId];
            } else {
                state.posts = {};
                state.pendingPosts = {};
                state.pagination = {};
            }
        },
        updatePostLocally: (state, action) => {
            const { groupId, postId, updates } = action.payload;
            
            if (state.posts[groupId]) {
                const postIndex = state.posts[groupId].findIndex(post => post._id === postId);
                if (postIndex !== -1) {
                    state.posts[groupId][postIndex] = {
                        ...state.posts[groupId][postIndex],
                        ...updates
                    };
                }
            }
        }
    },
    extraReducers: (builder) => {
        builder
            // Create Group Post
            .addCase(createGroupPost.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createGroupPost.fulfilled, (state, action) => {
                state.loading = false;
                const post = action.payload;
                const groupId = post.group._id || post.group;
                
                if (!state.posts[groupId]) {
                    state.posts[groupId] = [];
                }
                
                // Add to beginning if approved, or to pending if not approved
                if (post.approval_status === 'approved') {
                    state.posts[groupId].unshift(post);
                } else {
                    if (!state.pendingPosts[groupId]) {
                        state.pendingPosts[groupId] = [];
                    }
                    state.pendingPosts[groupId].unshift(post);
                }
            })
            .addCase(createGroupPost.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            
            // Get Group Posts
            .addCase(getGroupPosts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getGroupPosts.fulfilled, (state, action) => {
                state.loading = false;
                const { posts, currentPage, totalPages, totalPosts, groupId } = action.payload;
                
                if (currentPage === 1) {
                    state.posts[groupId] = posts;
                } else {
                    if (!state.posts[groupId]) {
                        state.posts[groupId] = [];
                    }
                    state.posts[groupId].push(...posts);
                }
                
                state.pagination[groupId] = {
                    currentPage,
                    totalPages,
                    totalPosts
                };
            })
            .addCase(getGroupPosts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            
            // Get Pending Posts
            .addCase(getPendingPosts.fulfilled, (state, action) => {
                const posts = action.payload;
                if (posts.length > 0) {
                    const groupId = posts[0].group._id || posts[0].group;
                    state.pendingPosts[groupId] = posts;
                }
            })
            
            // Moderate Post
            .addCase(moderatePost.fulfilled, (state, action) => {
                const { postId, action: moderationAction } = action.payload;
                
                // Remove from pending posts in all groups
                Object.keys(state.pendingPosts).forEach(groupId => {
                    state.pendingPosts[groupId] = state.pendingPosts[groupId].filter(
                        post => post._id !== postId
                    );
                });
                
                // If approved, we'll refetch the posts to get the updated list
                // If rejected, the post just disappears from pending
            })
            
            // Toggle Like
            .addCase(toggleLikeGroupPost.fulfilled, (state, action) => {
                const { postId, isLiked, likesCount } = action.payload;
                
                Object.keys(state.posts).forEach(groupId => {
                    const postIndex = state.posts[groupId].findIndex(post => post._id === postId);
                    if (postIndex !== -1) {
                        state.posts[groupId][postIndex].likes_count = Array(likesCount).fill(null);
                    }
                });
            })
            
            // Toggle Pin
            .addCase(togglePinPost.fulfilled, (state, action) => {
                const { postId, isPinned } = action.payload;
                
                Object.keys(state.posts).forEach(groupId => {
                    const postIndex = state.posts[groupId].findIndex(post => post._id === postId);
                    if (postIndex !== -1) {
                        state.posts[groupId][postIndex].is_pinned = isPinned;
                    }
                });
            })
            
            // Delete Post
            .addCase(deleteGroupPost.fulfilled, (state, action) => {
                const postId = action.payload;
                
                // Remove from all groups posts
                Object.keys(state.posts).forEach(groupId => {
                    state.posts[groupId] = state.posts[groupId].filter(
                        post => post._id !== postId
                    );
                });
                
                // Remove from pending posts
                Object.keys(state.pendingPosts).forEach(groupId => {
                    state.pendingPosts[groupId] = state.pendingPosts[groupId].filter(
                        post => post._id !== postId
                    );
                });
            })
            
            // Vote on Poll
            .addCase(voteOnPoll.fulfilled, (state, action) => {
                const { postId, poll_data } = action.payload;
                
                Object.keys(state.posts).forEach(groupId => {
                    const postIndex = state.posts[groupId].findIndex(post => post._id === postId);
                    if (postIndex !== -1) {
                        state.posts[groupId][postIndex].poll_data = poll_data;
                    }
                });
            });
    }
});

export const {
    clearGroupPostsError,
    clearGroupPosts,
    updatePostLocally
} = groupPostsSlice.actions;

export default groupPostsSlice.reducer;
