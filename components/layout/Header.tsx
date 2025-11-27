import React from 'react';
import type { Theme } from '../../types';

interface HeaderProps {
    username?: string;
    theme: Theme;
    onThemeToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ username, theme, onThemeToggle }) => {
    return (
        <header className="fixed top-0 left-0 right-0 h-14 bg-[--color-bg-elevated] border-b border-[--color-border] flex items-center justify-between px-4 z-50 safe-area-top">
            {/* Left: Username */}
            <div className="flex items-center min-w-0 flex-1">
                {username && (
                    <span className="text-sm font-medium text-[--color-text-secondary] truncate">
                        @{username}
                    </span>
                )}
            </div>

            {/* Center: vibeX Logo */}
            <div className="flex items-center justify-center flex-shrink-0 px-4">
                <h1 className="text-xl font-bold tracking-tight">
                    <span style={{ color: 'var(--color-accent-primary)' }}>vibe</span>
                    <span style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>X</span>
                </h1>
            </div>

            {/* Right: Dark Mode Toggle */}
            <div className="flex items-center justify-end flex-1">
                <button
                    onClick={onThemeToggle}
                    className="p-2 rounded-lg hover:bg-[--color-bg-secondary] transition-colors duration-200 active:scale-95"
                    aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                >
                    {theme === 'light' ? (
                        // Moon icon for dark mode
                        <svg className="w-5 h-5 text-[--color-text-secondary]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                    ) : (
                        // Sun icon for light mode
                        <svg className="w-5 h-5 text-[--color-text-secondary]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    )}
                </button>
            </div>
        </header>
    );
};

export default React.memo(Header);
