import React, { useState } from 'react';
import { createTag, deleteTag } from '../../lib/supabaseService';
import type { Tag } from '../../types';

interface TagsPanelProps {
  currentUserId: string;
  tags: Tag[];
  onRefresh: () => void;
  onEditMembers: (tag: Tag) => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

const TAG_COLORS = [
  '#EF4444', // red
  '#F59E0B', // amber
  '#10B981', // green
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
];

const TAG_EMOJIS = ['🏀', '⚽', '🎮', '📚', '🎵', '🎨', '☕', '🍕', '🎬', '💻', '🏋️', '🎯'];

const TagsPanel: React.FC<TagsPanelProps> = ({ currentUserId, tags, onRefresh, onEditMembers, onError, onSuccess }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);
  const [selectedEmoji, setSelectedEmoji] = useState(TAG_EMOJIS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTagName.trim()) {
      onError('Tag name is required');
      return;
    }

    setIsSubmitting(true);
    const { error } = await createTag(
      { name: newTagName.trim(), color: selectedColor, emoji: selectedEmoji },
      currentUserId
    );
    setIsSubmitting(false);

    if (error) {
      onError(error.message);
      return;
    }

    onSuccess('Tag created!');
    setNewTagName('');
    setIsCreating(false);
    onRefresh();
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('Delete this tag? This will not remove friends, only the tag.')) return;

    const { error } = await deleteTag(tagId);
    if (error) {
      onError('Failed to delete tag');
      return;
    }

    onSuccess('Tag deleted');
    onRefresh();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-[--color-border]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-[--color-text-primary]">Tags</h2>
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="p-2 hover:bg-[--color-bg-secondary] rounded-lg transition-colors"
          >
            {isCreating ? (
              <svg className="w-5 h-5 text-[--color-text-secondary]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-[--color-accent-primary]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )}
          </button>
        </div>

        {/* Create Tag Form */}
        {isCreating && (
          <form onSubmit={handleCreateTag} className="space-y-3">
            <input
              type="text"
              placeholder="Tag name..."
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              maxLength={50}
              className="w-full px-3 py-2 bg-[--color-bg-secondary] border border-[--color-border] rounded-lg text-[--color-text-primary] placeholder-[--color-text-tertiary] focus:outline-none focus:ring-2 focus:ring-[--color-accent-primary]"
            />

            {/* Color Picker */}
            <div>
              <div className="text-xs text-[--color-text-secondary] mb-2">Color</div>
              <div className="flex gap-2 flex-wrap">
                {TAG_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full transition-all ${selectedColor === color ? 'ring-2 ring-offset-2 ring-[--color-accent-primary]' : ''}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Emoji Picker */}
            <div>
              <div className="text-xs text-[--color-text-secondary] mb-2">Emoji</div>
              <div className="flex gap-2 flex-wrap">
                {TAG_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedEmoji(emoji)}
                    className={`w-10 h-10 text-xl rounded-lg transition-all ${selectedEmoji === emoji ? 'bg-[--color-accent-primary]/20 ring-2 ring-[--color-accent-primary]' : 'hover:bg-[--color-bg-tertiary]'}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !newTagName.trim()}
              className="w-full py-2 bg-[--color-accent-primary] text-white font-medium rounded-lg hover:bg-[--color-accent-primary-hover] disabled:opacity-50 transition-all"
            >
              {isSubmitting ? 'Creating...' : 'Create Tag'}
            </button>
          </form>
        )}
      </div>

      {/* Tags List */}
      <div className="flex-1 overflow-y-auto">
        {tags.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <svg className="w-16 h-16 text-[--color-text-tertiary] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <p className="text-[--color-text-secondary] font-medium">No tags yet</p>
            <p className="text-sm text-[--color-text-tertiary] mt-1">Create tags to organize your friends</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="p-4 rounded-xl border-2 hover:shadow-md transition-all cursor-pointer"
                style={{ borderColor: `${tag.color}40`, backgroundColor: `${tag.color}10` }}
                onClick={() => onEditMembers(tag)}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl flex-shrink-0">{tag.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[--color-text-primary] truncate">
                      {tag.name}
                    </div>
                    <div className="text-sm text-[--color-text-secondary]">
                      {tag.member_count || 0} {tag.member_count === 1 ? 'friend' : 'friends'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTag(tag.id);
                      }}
                      className="p-2 hover:bg-[--color-error]/20 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4 text-[--color-error]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <svg className="w-5 h-5 text-[--color-text-tertiary]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TagsPanel;