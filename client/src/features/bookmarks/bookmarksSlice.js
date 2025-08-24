import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

// Async thunks for API calls
export const toggleBookmark = createAsyncThunk(
    'bookmarks/toggleBookmark',
    async ({ postId, token }, { rejectWithValue }) => {
        try {
            const response = await api.post('/api/bookmark/toggle', {
                postId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                return { 
                    postId, 
                    isBookmarked: response.data.isBookmarked,
                    message: response.data.message 
                };
            } else {
                return rejectWithValue(response.data.message);
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to toggle bookmark');
        }
    }
);

export const fetchBookmarkedPosts = createAsyncThunk(
    'bookmarks/fetchBookmarkedPosts',
    async ({ token }, { rejectWithValue }) => {
        try {
            const response = await api.get('/api/bookmark', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                return {
                    posts: response.data.posts,
                    count: response.data.count
                };
            } else {
                return rejectWithValue(response.data.message);
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to load bookmarked posts');
        }
    }
);

export const checkBookmarkStatus = createAsyncThunk(
    'bookmarks/checkBookmarkStatus',
    async ({ postIds, token }, { rejectWithValue }) => {
        try {
            const response = await api.post('/api/bookmark/status', {
                postIds
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                return response.data.bookmarkStatus;
            } else {
                return rejectWithValue(response.data.message);
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to check bookmark status');
        }
    }
);

const bookmarksSlice = createSlice({
    name: 'bookmarks',
    initialState: {
        posts: [],
        bookmarkStatus: {}, // postId -> boolean mapping
        loading: false,
        error: null,
        toggleLoading: {}, // postId -> boolean mapping for individual toggle states
        count: 0
    },
    reducers: {
        clearBookmarksError: (state) => {
            state.error = null;
        },
        setBookmarkStatus: (state, action) => {
            const { postId, isBookmarked } = action.payload;
            state.bookmarkStatus[postId] = isBookmarked;
        },
        clearBookmarkStatus: (state) => {
            state.bookmarkStatus = {};
        },
        updateBookmarkOptimistic: (state, action) => {
            const { postId, isBookmarked } = action.payload;
            state.bookmarkStatus[postId] = isBookmarked;
            
            // If unbookmarking, remove from posts array if present
            if (!isBookmarked) {
                state.posts = state.posts.filter(post => post._id !== postId);
                state.count = state.posts.length;
            }
        }
    },
    extraReducers: (builder) => {
        builder
            // Toggle Bookmark
            .addCase(toggleBookmark.pending, (state, action) => {
                const { postId } = action.meta.arg;
                state.toggleLoading[postId] = true;
                state.error = null;
            })
            .addCase(toggleBookmark.fulfilled, (state, action) => {
                const { postId, isBookmarked } = action.payload;
                state.toggleLoading[postId] = false;
                state.bookmarkStatus[postId] = isBookmarked;
                
                // If unbookmarking, remove from posts array
                if (!isBookmarked) {
                    state.posts = state.posts.filter(post => post._id !== postId);
                    state.count = state.posts.length;
                }
            })
            .addCase(toggleBookmark.rejected, (state, action) => {
                const { postId } = action.meta.arg;
                state.toggleLoading[postId] = false;
                state.error = action.payload;
                
                // Revert optimistic update
                const originalStatus = !state.bookmarkStatus[postId];
                state.bookmarkStatus[postId] = originalStatus;
            })
            
            // Fetch Bookmarked Posts
            .addCase(fetchBookmarkedPosts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchBookmarkedPosts.fulfilled, (state, action) => {
                state.loading = false;
                state.posts = action.payload.posts;
                state.count = action.payload.count;
                
                // Update bookmark status for all fetched posts
                action.payload.posts.forEach(post => {
                    state.bookmarkStatus[post._id] = true;
                });
            })
            .addCase(fetchBookmarkedPosts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            
            // Check Bookmark Status
            .addCase(checkBookmarkStatus.fulfilled, (state, action) => {
                state.bookmarkStatus = { ...state.bookmarkStatus, ...action.payload };
            });
    }
});

export const { 
    clearBookmarksError, 
    setBookmarkStatus, 
    clearBookmarkStatus,
    updateBookmarkOptimistic 
} = bookmarksSlice.actions;

export default bookmarksSlice.reducer;
