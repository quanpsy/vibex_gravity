import React, { useState } from 'react';
import { addMemberToTag, removeMemberFromTag } from '../../lib/supabaseService';
import type { Friend, Tag } from '../../types';

interface AssignTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  friend: Friend | null;
  allTags: Tag[];
  onRefresh: () => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

const AssignTagModal: React.FC<AssignTagModalProps> = ({
  isOpen,
  onClose,
  friend,
  allTags,
  onRefresh,
  onError,
  onSuccess,
}) => {
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpen && friend) {
      // Initialize with friend's current tags
      const currentTagIds = friend.tags?.map(t => t.id) || [];
      setSelectedTags(new Set(currentTagIds));
    }
  }, [isOpen, friend]);

  const handleToggleTag = (tagId: string) => {
    const newSelected = new Set(selectedTags);
    if (newSelected.has(tagId)) {
      newSelected.delete(tagId);
    } else {
      newSelected.add(tagId);
    }
    setSelectedTags(newSelected);
  };

  const handleSave = async () => {
    if (!friend) return;

    setIsSubmitting(true);

    const currentTagIds = friend.tags?.map(t => t.id) || [];
    const toAdd = Array.from(selectedTags).filter(id => !currentTagIds.includes(id));
    const toRemove = currentTagIds.filter(id => !selectedTags.has(id));

    // Add new tags
    for (const tagId of toAdd) {
      const { error } = await addMemberToTag(tagId, friend.id);
      if (error) {
        onError('Failed to add tag');
        setIsSubmitting(false);
        return;
      }
    }

    // Remove old tags
    for (const tagId of toRemove) {
      const { error } = await removeMemberFromTag(tagId, friend.id);
      if (error) {
        onError('Failed to remove tag');
        setIsSubmitting(false);
        return;
      }
    }

    setIsSubmitting(false);
    onSuccess('Tags updated!');
    onRefresh();
    onClose();
  };

  if (!isOpen || !friend) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[--color-bg-elevated] rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[80vh] overflow-y-auto modal-slide-up-panel">
        {/* Header */}
        <div className="sticky top-0 bg-[--color-bg-elevated] border-b border-[--color-border] px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-[--color-text-primary]">Assign Tags</h2>
            <p className="text-sm text-[--color-text-secondary] mt-1">@{friend.username}</p>
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

        {/* Content */}
        <div className="p-6">
          {allTags.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[--color-text-secondary]">No tags created yet</p>
              <p className="text-sm text-[--color-text-tertiary] mt-1">
                Create tags in the Tags panel first
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {allTags.map((tag) => {
                const isSelected = selectedTags.has(tag.id);
                return (
                  <label
                    key={tag.id}
                    className={`
                      flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                      ${isSelected
                        ? 'border-[--color-accent-primary] bg-[--color-accent-primary]/10'
                        : 'border-[--color-border] hover:border-[--color-accent-primary]/50'
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleTag(tag.id)}
                      className="w-5 h-5 rounded border-2 border-[--color-border] text-[--color-accent-primary] focus:ring-2 focus:ring-[--color-accent-primary]"
                    />
                    <div className="text-2xl">{tag.emoji}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-[--color-text-primary]">{tag.name}</div>
                      <div className="text-xs text-[--color-text-secondary]">
                        {tag.member_count || 0} {tag.member_count === 1 ? 'friend' : 'friends'}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          {/* Save Button */}
          {allTags.length > 0 && (
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="w-full mt-6 py-3 bg-[--color-accent-primary] text-white font-semibold rounded-xl hover:bg-[--color-accent-primary-hover] disabled:opacity-50 transition-all"
            >
              {isSubmitting ? 'Saving...' : 'Save Tags'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignTagModal;