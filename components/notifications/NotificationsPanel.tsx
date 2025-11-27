import React, { useState, useEffect } from 'react';
import { fetchNotifications, markNotificationRead } from '../../lib/supabaseService';
import type { Notification } from '../../types';

interface NotificationsPanelProps {
    currentUserId: string;
    onNotificationClick: (notification: Notification) => void;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ currentUserId, onNotificationClick }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadNotifications();
    }, [currentUserId]);

    const loadNotifications = async () => {
        setIsLoading(true);
        const { data } = await fetchNotifications(currentUserId);
        setIsLoading(false);
        if (data) setNotifications(data);
    };

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.is_read) {
            await markNotificationRead(notification.id);
            setNotifications(prev =>
                prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
            );
        }
        onNotificationClick(notification);
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'friend_request_received':
                return '👋';
            case 'friend_request_accepted':
                return '✅';
            case 'session_invite':
                return '📨';
            case 'session_join':
                return '🎉';
            case 'session_starting_soon':
                return '⏰';
            case 'session_ending_soon':
                return '⏱️';
            case 'ownership_transfer':
                return '👑';
            case 'vouch_received':
                return '🍪';
            default:
                return '🔔';
        }
    };

    const getNotificationText = (notification: Notification) => {
        const actor = notification.actor?.username || 'Someone';

        switch (notification.type) {
            case 'friend_request_received':
                return `${actor} sent you a friend request`;
            case 'friend_request_accepted':
                return `${actor} accepted your friend request`;
            case 'session_invite':
                return `${actor} invited you to "${notification.session?.title}"`;
            case 'session_join':
                return `${actor} joined your session`;
            case 'session_starting_soon':
                return `Your session "${notification.session?.title}" starts in 10 minutes`;
            case 'session_ending_soon':
                return `Your session "${notification.session?.title}" ends in 5 minutes`;
            case 'ownership_transfer':
                return `${actor} made you the owner of "${notification.session?.title}"`;
            case 'vouch_received':
                return `${actor} vouched for you!`;
            default:
                return notification.message || 'New notification';
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-[--color-border]">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-[--color-text-primary]">Notifications</h2>
                    {unreadCount > 0 && (
                        <span className="px-2 py-1 bg-[--color-accent-primary] text-white text-xs font-bold rounded-full">
                            {unreadCount}
                        </span>
                    )}
                </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="w-8 h-8 border-2 border-[--color-accent-primary] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-6">
                        <svg className="w-16 h-16 text-[--color-text-tertiary] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341A6.002 6.002 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <p className="text-[--color-text-secondary] font-medium">No notifications</p>
                        <p className="text-sm text-[--color-text-tertiary] mt-1">You're all caught up!</p>
                    </div>
                ) : (
                    <div className="divide-y divide-[--color-border]">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`p-4 hover:bg-[--color-bg-secondary] transition-colors cursor-pointer ${!notification.is_read ? 'bg-[--color-accent-primary]/5' : ''
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Icon */}
                                    <div className="text-2xl flex-shrink-0">
                                        {getNotificationIcon(notification.type)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className={`text-sm ${!notification.is_read ? 'font-medium text-[--color-text-primary]' : 'text-[--color-text-secondary]'}`}>
                                            {getNotificationText(notification)}
                                        </div>
                                        <div className="text-xs text-[--color-text-tertiary] mt-1">
                                            {formatTime(notification.created_at)}
                                        </div>
                                    </div>

                                    {/* Unread Indicator */}
                                    {!notification.is_read && (
                                        <div className="w-2 h-2 bg-[--color-accent-primary] rounded-full flex-shrink-0 mt-2" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPanel;
