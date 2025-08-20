import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bell, BellRing } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { fetchNotificationStats } from '../features/notifications/notificationsSlice';

const NotificationBadge = ({ className = "" }) => {
    const dispatch = useDispatch();
    const { getToken } = useAuth();
    const { unreadCount } = useSelector(state => state.notifications);

    useEffect(() => {
        // Load notification stats on component mount
        const loadStats = async () => {
            try {
                const token = await getToken();
                dispatch(fetchNotificationStats({ token }));
            } catch (error) {
                console.error('Failed to load notification stats:', error);
            }
        };

        loadStats();
        
        // Set up periodic refresh (every 30 seconds)
        const interval = setInterval(loadStats, 30000);
        
        return () => clearInterval(interval);
    }, [dispatch, getToken]);

    return (
        <div className={`relative ${className}`}>
            {unreadCount > 0 ? (
                <BellRing className="w-5 h-5" />
            ) : (
                <Bell className="w-5 h-5" />
            )}
            
            {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </div>
    );
};

export default NotificationBadge;
