import React, { useState } from 'react';
import { fetchFriends } from '../../lib/supabaseService';
import type { Friend, Tag } from '../../types';

interface FriendsPanelProps {
  currentUserId: string;
  friends: Friend[];
  onRefresh: () => void;
  onAssignTags: (friend: Friend) => void;
}

const FriendsPanel: React.FC<FriendsPanelProps> = ({ currentUserId, friends, onRefresh, onAssignTags }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFriends = friends.filter(friend =>
    friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-[--color-border]">
        <h2 className="text-lg font-bold text-[--color-text-primary] mb-3">Friends</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search friends..."
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
      </div>

      {/* Friends List */}
      <div className="flex-1 overflow-y-auto">
        {filteredFriends.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <svg className="w-16 h-16 text-[--color-text-tertiary] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p className="text-[--color-text-secondary] font-medium">
              {searchQuery ? 'No friends found' : 'No friends yet'}
            </p>
            <p className="text-sm text-[--color-text-tertiary] mt-1">
              {searchQuery ? 'Try a different search' : 'Search for users to add friends'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[--color-border]">
            {filteredFriends.map((friend) => (
              <div
                key={friend.id}
                className="p-4 hover:bg-[--color-bg-secondary] transition-colors cursor-pointer"
                onClick={() => onAssignTags(friend)}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[--color-accent-primary] to-[--color-accent-secondary] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {friend.username.charAt(0).toUpperCase()}
                  </div>

                  {/* Friend Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[--color-text-primary] truncate">
                      @{friend.username}
                    </div>
                    {friend.full_name && (
                      <div className="text-sm text-[--color-text-secondary] truncate">
                        {friend.full_name}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {friend.branch && (
                        <span className="text-xs px-2 py-0.5 bg-[--color-bg-tertiary] rounded text-[--color-text-tertiary]">
                          {friend.branch}
                        </span>
                      )}
                      {friend.year && (
                        <span className="text-xs px-2 py-0.5 bg-[--color-bg-tertiary] rounded text-[--color-text-tertiary]">
                          Year {friend.year}
                        </span>
                      )}
                      {friend.cookie_score > 0 && (
                        <span className="text-xs font-medium text-[--color-accent-primary]">
                          🍪 {friend.cookie_score}
                        </span>
                      )}
                    </div>
                    {/* Tags */}
                    {friend.tags && friend.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-2 flex-wrap">
                        {friend.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag.id}
                            className="text-xs px-2 py-1 rounded-full flex items-center gap-1"
                            style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                          >
                            {tag.emoji && <span>{tag.emoji}</span>}
                            <span>{tag.name}</span>
                          </span>
                        ))}
                        {friend.tags.length > 3 && (
                          <span className="text-xs text-[--color-text-tertiary]">
                            +{friend.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Chevron */}
                  <svg className="w-5 h-5 text-[--color-text-tertiary] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsPanel;