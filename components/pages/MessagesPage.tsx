import React, { useState } from 'react';
import MessagesPanel from '../messages/MessagesPanel';
import NotificationsPanel from '../notifications/NotificationsPanel';
import DirectMessageModal from '../messages/DirectMessageModal';
import type { Conversation, Notification } from '../../types';

interface MessagesPageProps {
    currentUserId: string;
    onError: (message: string) => void;
    onNavigateToSession?: (sessionId: number) => void;
    onNavigateToProfile?: (userId: string) => void;
}

const MessagesPage: React.FC<MessagesPageProps> = ({
    currentUserId,
    onError,
    onNavigateToSession,
    onNavigateToProfile,
}) => {
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

    const handleOpenConversation = (conversation: Conversation) => {
        setSelectedConversation(conversation);
    };

    const handleCloseConversation = () => {
        setSelectedConversation(null);
    };

    const handleNotificationClick = (notification: Notification) => {
        // Navigate based on notification type
        if (notification.session_id && onNavigateToSession) {
            onNavigateToSession(notification.session_id);
        } else if (notification.actor_id && onNavigateToProfile) {
            onNavigateToProfile(notification.actor_id);
        }
    };

    return (
        <div className="h-full bg-[--color-bg-primary] flex">
            {/* Messages Panel (Left) */}
            <div className="flex-1 border-r border-[--color-border] overflow-hidden">
                <MessagesPanel
                    currentUserId={currentUserId}
                    onOpenConversation={handleOpenConversation}
                />
            </div>

            {/* Notifications Panel (Right) */}
            <div className="w-80 overflow-hidden">
                <NotificationsPanel
                    currentUserId={currentUserId}
                    onNotificationClick={handleNotificationClick}
                />
            </div>

            {/* Direct Message Modal */}
            <DirectMessageModal
                isOpen={selectedConversation !== null}
                onClose={handleCloseConversation}
                conversation={selectedConversation}
                currentUserId={currentUserId}
                onError={onError}
            />
        </div>
    );
};

export default MessagesPage;
