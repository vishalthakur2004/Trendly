import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

// Async thunks for API calls
export const fetchNotifications = createAsyncThunk(
    'notifications/fetchNotifications',
    async ({ page = 1, limit = 20, unread_only = false, token }, { rejectWithValue }) => {
        try {
            const response = await api.get(`/api/notification?page=${page}&limit=${limit}&unread_only=${unread_only}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                return response.data;
            } else {
                return rejectWithValue(response.data.message);
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to load notifications');
        }
    }
);

export const markNotificationAsRead = createAsyncThunk(
    'notifications/markAsRead',
    async ({ notificationId, token }, { rejectWithValue }) => {
        try {
            const response = await api.post('/api/notification/mark-read', {
                notificationId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                return { notificationId };
            } else {
                return rejectWithValue(response.data.message);
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to mark notification as read');
        }
    }
);

export const markAllAsRead = createAsyncThunk(
    'notifications/markAllAsRead',
    async ({ token }, { rejectWithValue }) => {
        try {
            const response = await api.post('/api/notification/mark-read', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                return true;
            } else {
                return rejectWithValue(response.data.message);
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to mark all notifications as read');
        }
    }
);

export const deleteNotification = createAsyncThunk(
    'notifications/deleteNotification',
    async ({ notificationId, token }, { rejectWithValue }) => {
        try {
            const response = await api.delete('/api/notification/delete', {
                data: { notificationId },
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                return { notificationId };
            } else {
                return rejectWithValue(response.data.message);
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete notification');
        }
    }
);

export const fetchNotificationStats = createAsyncThunk(
    'notifications/fetchStats',
    async ({ token }, { rejectWithValue }) => {
        try {
            const response = await api.get('/api/notification/stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                return response.data;
            } else {
                return rejectWithValue(response.data.message);
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to load notification stats');
        }
    }
);

const notificationsSlice = createSlice({
    name: 'notifications',
    initialState: {
        notifications: [],
        unreadCount: 0,
        stats: null,
        loading: false,
        error: null,
        currentPage: 1,
        totalPages: 1,
        hasMore: true,
    },
    reducers: {
        clearNotificationsError: (state) => {
            state.error = null;
        },
        clearNotifications: (state) => {
            state.notifications = [];
            state.currentPage = 1;
            state.totalPages = 1;
            state.hasMore = true;
        },
        addNewNotification: (state, action) => {
            // Add new notification to the top of the list
            state.notifications.unshift(action.payload);
            state.unreadCount += 1;
        },
        updateNotificationRead: (state, action) => {
            const { notificationId } = action.payload;
            const notification = state.notifications.find(n => n._id === notificationId);
            if (notification && !notification.is_read) {
                notification.is_read = true;
                state.unreadCount = Math.max(0, state.unreadCount - 1);
            }
        },
        setUnreadCount: (state, action) => {
            state.unreadCount = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Notifications
            .addCase(fetchNotifications.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                const { notifications, unreadCount, currentPage, totalPages } = action.payload;
                
                if (currentPage === 1) {
                    state.notifications = notifications;
                } else {
                    // Append for pagination
                    state.notifications = [...state.notifications, ...notifications];
                }
                
                state.unreadCount = unreadCount;
                state.currentPage = currentPage;
                state.totalPages = totalPages;
                state.hasMore = currentPage < totalPages;
                state.loading = false;
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            
            // Mark as Read
            .addCase(markNotificationAsRead.fulfilled, (state, action) => {
                const { notificationId } = action.payload;
                const notification = state.notifications.find(n => n._id === notificationId);
                if (notification && !notification.is_read) {
                    notification.is_read = true;
                    state.unreadCount = Math.max(0, state.unreadCount - 1);
                }
            })
            
            // Mark All as Read
            .addCase(markAllAsRead.fulfilled, (state) => {
                state.notifications.forEach(notification => {
                    notification.is_read = true;
                });
                state.unreadCount = 0;
            })
            
            // Delete Notification
            .addCase(deleteNotification.fulfilled, (state, action) => {
                const { notificationId } = action.payload;
                const notificationIndex = state.notifications.findIndex(n => n._id === notificationId);
                if (notificationIndex !== -1) {
                    const notification = state.notifications[notificationIndex];
                    if (!notification.is_read) {
                        state.unreadCount = Math.max(0, state.unreadCount - 1);
                    }
                    state.notifications.splice(notificationIndex, 1);
                }
            })
            
            // Fetch Stats
            .addCase(fetchNotificationStats.fulfilled, (state, action) => {
                state.stats = action.payload.stats;
                state.unreadCount = action.payload.totalUnread;
            });
    }
});

export const { 
    clearNotificationsError, 
    clearNotifications, 
    addNewNotification,
    updateNotificationRead,
    setUnreadCount
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
