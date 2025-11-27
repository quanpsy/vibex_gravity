import React, { useState, useEffect } from 'react';
import type { EmojiOption } from '../../types';

interface EmojiPickerProps {
    onSelect: (emoji: string) => void;
    recentEmojis?: string[];
    selectedEmoji?: string;
}

// Pre-defined emoji options organized by category
const EMOJI_OPTIONS: EmojiOption[] = [
    // Social & Fun
    { emoji: '🎉', label: 'Party', category: 'social' },
    { emoji: '🎮', label: 'Gaming', category: 'social' },
    { emoji: '🎬', label: 'Movies', category: 'social' },
    { emoji: '🎵', label: 'Music', category: 'social' },
    { emoji: '🎨', label: 'Art', category: 'social' },
    { emoji: '📚', label: 'Study', category: 'social' },
    { emoji: '☕', label: 'Coffee', category: 'social' },
    { emoji: '🍕', label: 'Food', category: 'social' },

    // Sports & Activities
    { emoji: '⚽', label: 'Football', category: 'sports' },
    { emoji: '🏀', label: 'Basketball', category: 'sports' },
    { emoji: '🏸', label: 'Badminton', category: 'sports' },
    { emoji: '🎾', label: 'Tennis', category: 'sports' },
    { emoji: '🏊', label: 'Swimming', category: 'sports' },
    { emoji: '🏋️', label: 'Gym', category: 'sports' },
    { emoji: '🧘', label: 'Yoga', category: 'sports' },
    { emoji: '♟️', label: 'Chess', category: 'sports' },

    // Study & Work
    { emoji: '💻', label: 'Coding', category: 'study' },
    { emoji: '📖', label: 'Reading', category: 'study' },
    { emoji: '✍️', label: 'Writing', category: 'study' },
    { emoji: '🔬', label: 'Science', category: 'study' },
    { emoji: '🧮', label: 'Math', category: 'study' },
    { emoji: '🎓', label: 'Learning', category: 'study' },
    { emoji: '📝', label: 'Notes', category: 'study' },
    { emoji: '🗣️', label: 'Discussion', category: 'study' },

    // Help & Support
    { emoji: '🤝', label: 'Help', category: 'help' },
    { emoji: '💡', label: 'Ideas', category: 'help' },
    { emoji: '🔧', label: 'Fix', category: 'help' },
    { emoji: '🛠️', label: 'Tools', category: 'help' },
    { emoji: '📱', label: 'Tech', category: 'help' },
    { emoji: '🎯', label: 'Goal', category: 'help' },

    // Items & Objects
    { emoji: '🔍', label: 'Search', category: 'items' },
    { emoji: '📦', label: 'Package', category: 'items' },
    { emoji: '🎒', label: 'Bag', category: 'items' },
    { emoji: '🔌', label: 'Electronics', category: 'items' },
    { emoji: '📷', label: 'Camera', category: 'items' },
    { emoji: '🎧', label: 'Headphones', category: 'items' },
    { emoji: '⌚', label: 'Watch', category: 'items' },
    { emoji: '🔑', label: 'Keys', category: 'items' },

    // Skills & Cookies
    { emoji: '🍪', label: 'Cookie', category: 'skills' },
    { emoji: '🎸', label: 'Guitar', category: 'skills' },
    { emoji: '🎹', label: 'Piano', category: 'skills' },
    { emoji: '🎤', label: 'Singing', category: 'skills' },
    { emoji: '📸', label: 'Photography', category: 'skills' },
    { emoji: '🎥', label: 'Video', category: 'skills' },
    { emoji: '✏️', label: 'Design', category: 'skills' },
    { emoji: '🖌️', label: 'Painting', category: 'skills' },
];

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, recentEmojis = [], selectedEmoji }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredEmojis, setFilteredEmojis] = useState(EMOJI_OPTIONS);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredEmojis(EMOJI_OPTIONS);
        } else {
            const query = searchQuery.toLowerCase();
            setFilteredEmojis(
                EMOJI_OPTIONS.filter(
                    (e) =>
                        e.label.toLowerCase().includes(query) ||
                        e.category.toLowerCase().includes(query)
                )
            );
        }
    }, [searchQuery]);

    // Get unique recent emojis (max 5)
    const uniqueRecent = Array.from(new Set(recentEmojis)).slice(0, 5);

    return (
        <div className="flex flex-col gap-3">
            {/* Search Input */}
            <div className="relative">
                <input
                    type="text"
                    placeholder="Search emojis..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 pl-10 bg-[--color-bg-secondary] border border-[--color-border] rounded-lg text-[--color-text-primary] placeholder-[--color-text-tertiary] focus:outline-none focus:ring-2 focus:ring-[--color-accent-primary]"
                />
                <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-text-tertiary]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>

            {/* Recent Emojis */}
            {uniqueRecent.length > 0 && searchQuery === '' && (
                <div>
                    <div className="text-xs font-medium text-[--color-text-secondary] mb-2">Recent</div>
                    <div className="flex gap-2 flex-wrap">
                        {uniqueRecent.map((emoji) => (
                            <button
                                key={`recent-${emoji}`}
                                onClick={() => onSelect(emoji)}
                                className={`
                  w-12 h-12 text-2xl rounded-lg
                  transition-all duration-150
                  hover:bg-[--color-bg-secondary] hover:scale-110
                  active:scale-95
                  ${selectedEmoji === emoji ? 'bg-[--color-accent-primary]/20 ring-2 ring-[--color-accent-primary]' : ''}
                `}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                    <div className="h-px bg-[--color-border] my-3" />
                </div>
            )}

            {/* All Emojis */}
            <div className="max-h-64 overflow-y-auto">
                <div className="grid grid-cols-6 gap-2">
                    {filteredEmojis.map((option) => (
                        <button
                            key={option.emoji}
                            onClick={() => onSelect(option.emoji)}
                            className={`
                w-12 h-12 text-2xl rounded-lg
                transition-all duration-150
                hover:bg-[--color-bg-secondary] hover:scale-110
                active:scale-95
                ${selectedEmoji === option.emoji ? 'bg-[--color-accent-primary]/20 ring-2 ring-[--color-accent-primary]' : ''}
              `}
                            title={option.label}
                        >
                            {option.emoji}
                        </button>
                    ))}
                </div>
                {filteredEmojis.length === 0 && (
                    <div className="text-center py-8 text-[--color-text-secondary]">
                        No emojis found
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmojiPicker;
