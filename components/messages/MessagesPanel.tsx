import React, { useState, useEffect } from 'react';
import { fetchConversations } from '../../lib/supabaseService';
import type { Conversation } from '../../types';

interface MessagesPanelProps {
    currentUserId: string;
    onOpenConversation: (conversation: Conversation) => void;
}

const MessagesPanel: React.FC<MessagesPanelProps> = ({ currentUserId, onOpenConversation }) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadConversations();
    }, [currentUserId]);

    const loadConversations = async () => {
        setIsLoading(true);
        const { data } = await fetchConversations(currentUserId);
        setIsLoading(false);
        if (data) setConversations(data);
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

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-[--color-border]">
                <h2 className="text-lg font-bold text-[--color-text-primary]">Messages</h2>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="w-8 h-8 border-2 border-[--color-accent-primary] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-6">
                        <svg className="w-16 h-16 text-[--color-text-tertiary] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        <p className="text-[--color-text-secondary] font-medium">No messages yet</p>
                        <p className="text-sm text-[--color-text-tertiary] mt-1">Start a conversation with a friend</p>
                    </div>
                ) : (
                    <div className="divide-y divide-[--color-border]">
                        {conversations.map((conversation) => {
                            const otherUser = conversation.other_user;
                            const lastMessage = conversation.last_message;
                            const hasUnread = conversation.unread_count > 0;

                            return (
                                <div
                                    key={conversation.id}
                                    onClick={() => onOpenConversation(conversation)}
                                    className="p-4 hover:bg-[--color-bg-secondary] transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Avatar */}
                                        <div className="relative flex-shrink-0">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[--color-accent-primary] to-[--color-accent-secondary] flex items-center justify-center text-white font-bold text-lg">
                                                {otherUser?.username?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            {hasUnread && (
                                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-[--color-accent-primary] rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                    {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline justify-between gap-2">
                                                <div className={`font-semibold truncate ${hasUnread ? 'text-[--color-text-primary]' : 'text-[--color-text-secondary]'}`}>
                                                    {otherUser?.full_name || `@${otherUser?.username}`}
                                                </div>
                                                {lastMessage && (
                                                    <div className="text-xs text-[--color-text-tertiary] flex-shrink-0">
                                                        {formatTime(lastMessage.created_at)}
                                                    </div>
                                                )}
                                            </div>
                                            {lastMessage && (
                                                <div className={`text-sm truncate mt-1 ${hasUnread ? 'text-[--color-text-primary] font-medium' : 'text-[--color-text-secondary]'}`}>
                                                    {lastMessage.sender_id === currentUserId && 'You: '}
                                                    {lastMessage.text}
                                                </div>
                                            )}
                                        </div>

                                        {/* Chevron */}
                                        <svg className="w-5 h-5 text-[--color-text-tertiary] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessagesPanel;
