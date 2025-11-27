import React, { useState } from 'react';
import type { SessionType } from '../../types';

interface FloatingActionButtonProps {
    onSessionTypeSelect: (type: SessionType) => void;
}

const sessionTypes = [
    {
        type: 'vibe' as SessionType,
        label: 'Vibe',
        icon: '🎉',
        description: 'Social gathering',
        color: '#8B5CF6', // purple
    },
    {
        type: 'help' as SessionType,
        label: 'Help',
        icon: '🤝',
        description: 'Seek or offer help',
        color: '#3B82F6', // blue
    },
    {
        type: 'cookie' as SessionType,
        label: 'Cookie',
        icon: '🍪',
        description: 'Share your skills',
        color: '#F59E0B', // amber
    },
    {
        type: 'query' as SessionType,
        label: 'Query',
        icon: '🔍',
        description: 'Borrow or lend items',
        color: '#10B981', // green
    },
];

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onSessionTypeSelect }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleTypeSelect = (type: SessionType) => {
        setIsOpen(false);
        onSessionTypeSelect(type);
    };

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-200"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Session Type Menu */}
            {isOpen && (
                <div className="fixed bottom-24 right-4 z-50 flex flex-col gap-3 animate-fade-slide-up">
                    {sessionTypes.map((session, index) => (
                        <button
                            key={session.type}
                            onClick={() => handleTypeSelect(session.type)}
                            className="flex items-center gap-3 bg-[--color-bg-elevated] rounded-2xl shadow-xl p-4 min-w-[200px] hover:scale-105 active:scale-95 transition-all duration-200"
                            style={{
                                animationDelay: `${index * 50}ms`,
                            }}
                        >
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                                style={{ backgroundColor: `${session.color}20` }}
                            >
                                {session.icon}
                            </div>
                            <div className="flex-1 text-left">
                                <div className="font-semibold text-[--color-text-primary]">{session.label}</div>
                                <div className="text-xs text-[--color-text-secondary]">{session.description}</div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Main FAB */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
          fixed bottom-20 right-4 z-50
          w-14 h-14 rounded-full
          bg-[--color-accent-primary] text-white
          shadow-lg hover:shadow-xl
          flex items-center justify-center
          transition-all duration-200
          ${isOpen ? 'rotate-45 scale-110' : 'hover:scale-110'}
          active:scale-95
        `}
                aria-label="Create session"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
            </button>
        </>
    );
};

export default FloatingActionButton;