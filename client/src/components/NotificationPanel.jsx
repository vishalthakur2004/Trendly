import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bell, BellRing, Trash2, Check, CheckCheck, X } from 'lucide-react';
import moment from 'moment';
import toast from 'react-hot-toast';
import { useAuth } from '@clerk/clerk-react';
import { 
    fetchNotifications, 
    markNotificationAsRead, 
    markAllAsRead,
    deleteNotification,
    clearNotificationsError 
} from '../features/notifications/notificationsSlice';
import { useNavigate } from 'react-router-dom';

const NotificationPanel = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { getToken } = useAuth();
    const panelRef = useRef(null);
    
    const { notifications, unreadCount, loading, error } = useSelector(state => state.notifications);
    const [isOpen, setIsOpen] = useState(false);
    const [filter, setFilter] = useState('all'); // 'all' or 'unread'

    useEffect(() => {
        if (isOpen) {
            if (notifications.length === 0) {
                loadNotifications();
            } else {
                // Auto-mark all notifications as read when panel opens
                markAllNotificationsAsRead();
            }
        }
    }, [isOpen]);

    const markAllNotificationsAsRead = async () => {
        try {
            const token = await getToken();
            const unreadNotifications = notifications.filter(n => !n.is_read);

            if (unreadNotifications.length > 0) {
                // Mark all as read without showing success message
                await dispatch(markAllAsRead({ token }));
            }
        } catch (error) {
            // Silently handle error - don't show toast for auto-marking
            console.error('Failed to auto-mark notifications as read:', error);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadNotifications = async () => {
        try {
            const token = await getToken();
            dispatch(fetchNotifications({ 
                page: 1, 
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
                    case 'like':
                    case 'comment':
                    case 'share':
                        navigate('/feed');
                        break;
                    default:
                        navigate('/feed');
                }
            }
            
            setIsOpen(false);
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

    const filteredNotifications = filter === 'unread' 
        ? notifications.filter(n => !n.is_read)
        : notifications;

    return (
        <div className="relative" ref={panelRef}>
            {/* Notification Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
                {unreadCount > 0 ? (
                    <BellRing className="w-6 h-6" />
                ) : (
                    <Bell className="w-6 h-6" />
                )}
                
                {/* Notification Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Panel */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-96 flex flex-col">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {/* Filter Tabs */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                                    filter === 'all' 
                                        ? 'bg-blue-100 text-blue-700' 
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setFilter('unread')}
                                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                                    filter === 'unread' 
                                        ? 'bg-blue-100 text-blue-700' 
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                Unread ({unreadCount})
                            </button>
                        </div>
                        
                        {/* Actions */}
                        {unreadCount > 0 && (
                            <div className="flex justify-end mt-2">
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                                >
                                    <CheckCheck className="w-3 h-3" />
                                    Mark all as read
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-gray-500">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-2 text-sm">Loading notifications...</p>
                            </div>
                        ) : error ? (
                            <div className="p-4 text-center text-red-500">
                                <p className="text-sm">{error}</p>
                                <button 
                                    onClick={loadNotifications}
                                    className="mt-2 text-xs text-blue-600 hover:underline"
                                >
                                    Try again
                                </button>
                            </div>
                        ) : filteredNotifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Bell className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                <p className="text-sm">
                                    {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {filteredNotifications.map((notification) => (
                                    <div
                                        key={notification._id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                                            !notification.is_read ? 'bg-blue-50' : ''
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Sender Avatar */}
                                            <img
                                                src={notification.sender.profile_picture}
                                                alt={notification.sender.full_name}
                                                className="w-10 h-10 rounded-full object-cover"
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
                                                    
                                                    {/* Type Icon */}
                                                    <span className="text-lg ml-2">
                                                        {getNotificationIcon(notification.type)}
                                                    </span>
                                                </div>
                                                
                                                {/* Read indicator */}
                                                {!notification.is_read && (
                                                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-1"></div>
                                                )}
                                            </div>
                                            
                                            {/* Delete Button */}
                                            <button
                                                onClick={(e) => handleDeleteNotification(notification._id, e)}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationPanel;
