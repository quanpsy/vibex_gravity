import React, { useState, useEffect, useRef } from 'react';
import { sendDirectMessage, getOrCreateConversation } from '../../lib/supabaseService';
import type { Conversation, DirectMessage } from '../../types';
import { PREMADE_MESSAGE_BLOCKS } from '../../types';

interface DirectMessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    conversation: Conversation | null;
    currentUserId: string;
    onError: (message: string) => void;
}

const DirectMessageModal: React.FC<DirectMessageModalProps> = ({
    isOpen,
    onClose,
    conversation,
    currentUserId,
    onError,
}) => {
    const [messages, setMessages] = useState<DirectMessage[]>([]);
    const [messageText, setMessageText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [showPremade, setShowPremade] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (conversation) {
            setMessages(conversation.direct_messages || []);
            scrollToBottom();
        }
    }, [conversation]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (text: string, isPremade: boolean = false) => {
        if (!conversation || !text.trim()) return;

        setIsSending(true);
        const { data, error } = await sendDirectMessage(
            conversation.id,
            currentUserId,
            text.trim(),
            isPremade
        );
        setIsSending(false);

        if (error) {
            onError('Failed to send message');
            return;
        }

        if (data) {
            setMessages([...messages, data]);
            setMessageText('');
            setShowPremade(false);
            scrollToBottom();
        }
    };

    const handlePremadeSelect = (text: string) => {
        handleSendMessage(text, true);
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (!isOpen || !conversation) return null;

    const otherUser = conversation.other_user;
    const charCount = messageText.length;
    const maxChars = 100;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-lg h-[90vh] sm:h-[600px] bg-[--color-bg-elevated] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col modal-slide-up-panel">
                {/* Header */}
                <div className="flex-shrink-0 bg-[--color-bg-elevated] border-b border-[--color-border] px-6 py-4 flex items-center justify-between rounded-t-3xl sm:rounded-t-3xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[--color-accent-primary] to-[--color-accent-secondary] flex items-center justify-center text-white font-bold">
                            {otherUser?.username?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                            <div className="font-semibold text-[--color-text-primary]">
                                {otherUser?.full_name || `@${otherUser?.username}`}
                            </div>
                            <div className="text-xs text-[--color-text-secondary]">
                                @{otherUser?.username}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[--color-bg-secondary] rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <svg className="w-16 h-16 text-[--color-text-tertiary] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <p className="text-[--color-text-secondary] font-medium">No messages yet</p>
                            <p className="text-sm text-[--color-text-tertiary] mt-1">Start the conversation!</p>
                        </div>
                    ) : (
                        messages.map((message, index) => {
                            const isOwn = message.sender_id === currentUserId;
                            const showTimestamp = index === 0 ||
                                new Date(message.created_at).getTime() - new Date(messages[index - 1].created_at).getTime() > 300000; // 5 min

                            return (
                                <div key={message.id}>
                                    {showTimestamp && (
                                        <div className="text-center text-xs text-[--color-text-tertiary] my-2">
                                            {formatTime(message.created_at)}
                                        </div>
                                    )}
                                    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                        <div
                                            className={`max-w-[75%] px-4 py-2 rounded-2xl ${isOwn
                                                    ? 'bg-[--color-accent-primary] text-white rounded-br-sm'
                                                    : 'bg-[--color-bg-secondary] text-[--color-text-primary] rounded-bl-sm'
                                                }`}
                                        >
                                            <p className="text-sm break-words">{message.text}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Pre-made Blocks */}
                {showPremade && (
                    <div className="flex-shrink-0 border-t border-[--color-border] p-3 bg-[--color-bg-secondary]">
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                            {PREMADE_MESSAGE_BLOCKS.map((block, index) => (
                                <button
                                    key={index}
                                    onClick={() => handlePremadeSelect(block)}
                                    className="px-3 py-2 bg-[--color-bg-elevated] hover:bg-[--color-bg-tertiary] rounded-lg text-sm text-left text-[--color-text-primary] transition-colors"
                                >
                                    {block}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Input */}
                <div className="flex-shrink-0 border-t border-[--color-border] p-4 bg-[--color-bg-elevated] rounded-b-3xl sm:rounded-b-3xl">
                    <div className="flex items-end gap-2">
                        {/* Pre-made Toggle */}
                        <button
                            onClick={() => setShowPremade(!showPremade)}
                            className={`p-2 rounded-lg transition-colors flex-shrink-0 ${showPremade
                                    ? 'bg-[--color-accent-primary] text-white'
                                    : 'bg-[--color-bg-secondary] text-[--color-text-secondary] hover:bg-[--color-bg-tertiary]'
                                }`}
                            title="Pre-made messages"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                            </svg>
                        </button>

                        {/* Text Input */}
                        <div className="flex-1 relative">
                            <textarea
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value.slice(0, maxChars))}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage(messageText);
                                    }
                                }}
                                placeholder="Type a message..."
                                rows={1}
                                maxLength={maxChars}
                                className="w-full px-4 py-2 bg-[--color-bg-secondary] border border-[--color-border] rounded-xl text-[--color-text-primary] placeholder-[--color-text-tertiary] focus:outline-none focus:ring-2 focus:ring-[--color-accent-primary] resize-none"
                                style={{ minHeight: '40px', maxHeight: '80px' }}
                            />
                            <div className="absolute bottom-1 right-2 text-xs text-[--color-text-tertiary]">
                                {charCount}/{maxChars}
                            </div>
                        </div>

                        {/* Send Button */}
                        <button
                            onClick={() => handleSendMessage(messageText)}
                            disabled={!messageText.trim() || isSending}
                            className="p-2 bg-[--color-accent-primary] text-white rounded-xl hover:bg-[--color-accent-primary-hover] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
                        >
                            {isSending ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DirectMessageModal;
