import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bell, BellRing, Trash2, CheckCheck, Filter } from 'lucide-react';
import moment from 'moment';
import toast from 'react-hot-toast';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { 
    fetchNotifications, 
    markNotificationAsRead, 
    markAllAsRead,
    deleteNotification,
    clearNotifications 
} from '../features/notifications/notificationsSlice';

const Notifications = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { getToken } = useAuth();
    
    const { notifications, unreadCount, loading, error, hasMore } = useSelector(state => state.notifications);
    const [filter, setFilter] = useState('all'); // 'all', 'unread', 'likes', 'comments', 'follows'
    const [page, setPage] = useState(1);

    useEffect(() => {
        dispatch(clearNotifications());
        loadNotifications(1);
    }, [filter]);

    const loadNotifications = async (pageNum = 1) => {
        try {
            const token = await getToken();
            dispatch(fetchNotifications({ 
                page: pageNum, 
                limit: 20, 
                unread_only: filter === 'unread',
                token 
            }));
        } catch (error) {
            toast.error('Failed to load notifications');
        }
    };

    const handleNotificationClick = async (notification) => {
        try {
            const token = await getToken();
            
            // Mark as read if unread
            if (!notification.is_read) {
                dispatch(markNotificationAsRead({ notificationId: notification._id, token }));
            }
            
            // Navigate to the related content
            if (notification.action_url) {
                navigate(notification.action_url);
            } else {
                // Fallback navigation based on type
                switch (notification.type) {
                    case 'follow':
                        navigate(`/profile/${notification.sender._id}`);
                        break;
                    case 'message':
                        navigate(`/messages/${notification.sender._id}`);
                        break;
                    default:
                        navigate('/feed');
                }
            }
        } catch (error) {
            toast.error('Failed to open notification');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const token = await getToken();
            await dispatch(markAllAsRead({ token })).unwrap();
            toast.success('All notifications marked as read');
        } catch (error) {
            toast.error('Failed to mark all as read');
        }
    };

    const handleDeleteNotification = async (notificationId, e) => {
        e.stopPropagation();
        try {
            const token = await getToken();
            await dispatch(deleteNotification({ notificationId, token })).unwrap();
            toast.success('Notification deleted');
        } catch (error) {
            toast.error('Failed to delete notification');
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'like':
                return '❤️';
            case 'comment':
            case 'reply':
                return '💬';
            case 'follow':
                return '👤';
            case 'message':
                return '📩';
            case 'share':
                return '🔄';
            case 'comment_like':
                return '👍';
            case 'mention':
                return '@';
            case 'call':
                return '📞';
            case 'missed_call':
                return '📵';
            case 'group_call':
                return '👥📞';
            default:
                return '🔔';
        }
    };

    const getFilteredNotifications = () => {
        switch (filter) {
            case 'unread':
                return notifications.filter(n => !n.is_read);
            case 'likes':
                return notifications.filter(n => n.type === 'like' || n.type === 'comment_like');
            case 'comments':
                return notifications.filter(n => n.type === 'comment' || n.type === 'reply');
            case 'follows':
                return notifications.filter(n => n.type === 'follow');
            default:
                return notifications;
        }
    };

    const filteredNotifications = getFilteredNotifications();

    return (
        <div className="h-full overflow-y-scroll bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <BellRing className="w-8 h-8 text-blue-600" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                                <p className="text-gray-600">
                                    {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
                                </p>
                            </div>
                        </div>
                        
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <CheckCheck className="w-4 h-4" />
                                Mark all as read
                            </button>
                        )}
                    </div>
                    
                    {/* Filter Tabs */}
                    <div className="flex gap-2 border-b border-gray-200">
                        {[
                            { key: 'all', label: 'All', icon: Bell },
                            { key: 'unread', label: `Unread (${unreadCount})`, icon: BellRing },
                            { key: 'likes', label: 'Likes', icon: '❤️' },
                            { key: 'comments', label: 'Comments', icon: '💬' },
                            { key: 'follows', label: 'Follows', icon: '👤' }
                        ].map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                onClick={() => setFilter(key)}
                                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                                    filter === key 
                                        ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-600' 
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    {typeof Icon === 'string' ? (
                                        <span>{Icon}</span>
                                    ) : (
                                        <Icon className="w-4 h-4" />
                                    )}
                                    {label}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Notifications List */}
                <div className="bg-white rounded-xl shadow">
                    {loading && notifications.length === 0 ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading notifications...</p>
                        </div>
                    ) : error ? (
                        <div className="p-8 text-center text-red-600">
                            <p>{error}</p>
                            <button 
                                onClick={() => loadNotifications(1)}
                                className="mt-2 text-blue-600 hover:underline"
                            >
                                Try again
                            </button>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium mb-2">No notifications</h3>
                            <p>
                                {filter === 'unread' 
                                    ? 'All notifications have been read' 
                                    : 'You\'ll see notifications here when you get them'}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {filteredNotifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors group ${
                                        !notification.is_read ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                                    }`}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Sender Avatar */}
                                        <img
                                            src={notification.sender.profile_picture}
                                            alt={notification.sender.full_name}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                        
                                        <div className="flex-1 min-w-0">
                                            {/* Content */}
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <p className={`text-sm ${
                                                        !notification.is_read ? 'font-medium text-gray-900' : 'text-gray-700'
                                                    }`}>
                                                        {notification.content}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {moment(notification.createdAt).fromNow()}
                                                    </p>
                                                </div>
                                                
                                                {/* Type Icon & Actions */}
                                                <div className="flex items-center gap-2 ml-4">
                                                    <span className="text-2xl">
                                                        {getNotificationIcon(notification.type)}
                                                    </span>
                                                    
                                                    {/* Delete Button */}
                                                    <button
                                                        onClick={(e) => handleDeleteNotification(notification._id, e)}
                                                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            {/* Read indicator */}
                                            {!notification.is_read && (
                                                <div className="flex items-center gap-1 mt-2">
                                                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                                    <span className="text-xs text-blue-600 font-medium">New</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Notifications;
