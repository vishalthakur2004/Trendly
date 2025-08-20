import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

// Async thunks for API calls
export const sharePost = createAsyncThunk(
    'posts/sharePost',
    async ({ postId, recipientIds, message, token }, { rejectWithValue }) => {
        try {
            const response = await api.post('/api/post/share', {
                postId,
                recipientIds,
                message
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                return { postId, message: response.data.message };
            } else {
                return rejectWithValue(response.data.message);
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to share post');
        }
    }
);

export const fetchUserConnections = createAsyncThunk(
    'posts/fetchUserConnections',
    async ({ token }, { rejectWithValue }) => {
        try {
            const response = await api.get('/api/post/connections', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                return response.data.connections;
            } else {
                return rejectWithValue(response.data.message);
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to load connections');
        }
    }
);

const postsSlice = createSlice({
    name: 'posts',
    initialState: {
        connections: [],
        sharing: {
            loading: false,
            error: null,
            postId: null
        },
        loading: false,
        error: null,
    },
    reducers: {
        clearPostsError: (state) => {
            state.error = null;
            state.sharing.error = null;
        },
        setSharePostId: (state, action) => {
            state.sharing.postId = action.payload;
        },
        clearShareState: (state) => {
            state.sharing = { loading: false, error: null, postId: null };
        },
        updatePostShares: (state, action) => {
            const { postId } = action.payload;
            // This would be used to update shares count if posts are stored in Redux
            // For now, it's a placeholder for future post management
        }
    },
    extraReducers: (builder) => {
        builder
            // Share Post
            .addCase(sharePost.pending, (state) => {
                state.sharing.loading = true;
                state.sharing.error = null;
            })
            .addCase(sharePost.fulfilled, (state, action) => {
                state.sharing.loading = false;
                // Could increment shares count for the post here
            })
            .addCase(sharePost.rejected, (state, action) => {
                state.sharing.loading = false;
                state.sharing.error = action.payload;
            })
            
            // Fetch User Connections
            .addCase(fetchUserConnections.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUserConnections.fulfilled, (state, action) => {
                state.loading = false;
                state.connections = action.payload;
            })
            .addCase(fetchUserConnections.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { 
    clearPostsError, 
    setSharePostId, 
    clearShareState, 
    updatePostShares 
} = postsSlice.actions;

export default postsSlice.reducer;
