import React, { useState, useEffect } from 'react';
import { searchUsers, sendFriendRequest, fetchFriendRequests } from '../../lib/supabaseService';
import type { Friend, FriendRequest } from '../../types';

interface SearchPanelProps {
  currentUserId: string;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

const SearchPanel: React.FC<SearchPanelProps> = ({ currentUserId, onError, onSuccess }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sendingRequestTo, setSendingRequestTo] = useState<string | null>(null);

  useEffect(() => {
    loadFriendRequests();
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const loadFriendRequests = async () => {
    const { data } = await fetchFriendRequests(currentUserId);
    if (data) setFriendRequests(data);
  };

  const performSearch = async () => {
    setIsSearching(true);
    const { data, error } = await searchUsers(searchQuery, currentUserId);
    setIsSearching(false);

    if (error) {
      onError('Failed to search users');
      return;
    }

    setSearchResults(data || []);
  };

  const handleSendRequest = async (toUserId: string) => {
    setSendingRequestTo(toUserId);
    const { error } = await sendFriendRequest(currentUserId, toUserId);
    setSendingRequestTo(null);

    if (error) {
      onError(error.message);
      return;
    }

    onSuccess('Friend request sent!');
    await loadFriendRequests();
  };

  const getRequestStatus = (userId: string): 'none' | 'sent' | 'received' => {
    const sent = friendRequests.find(r => r.from_user_id === currentUserId && r.to_user_id === userId);
    if (sent) return 'sent';

    const received = friendRequests.find(r => r.from_user_id === userId && r.to_user_id === currentUserId);
    if (received) return 'received';

    return 'none';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Input */}
      <div className="p-4 border-b border-[--color-border]">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-11 bg-[--color-bg-secondary] border border-[--color-border] rounded-xl text-[--color-text-primary] placeholder-[--color-text-tertiary] focus:outline-none focus:ring-2 focus:ring-[--color-accent-primary]"
          />
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[--color-text-tertiary]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {isSearching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-[--color-accent-primary] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto">
        {searchQuery.trim().length < 2 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <svg className="w-16 h-16 text-[--color-text-tertiary] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-[--color-text-secondary] font-medium">Search for users</p>
            <p className="text-sm text-[--color-text-tertiary] mt-1">Type at least 2 characters</p>
          </div>
        ) : searchResults.length === 0 && !isSearching ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <svg className="w-16 h-16 text-[--color-text-tertiary] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-[--color-text-secondary] font-medium">No users found</p>
            <p className="text-sm text-[--color-text-tertiary] mt-1">Try a different search term</p>
          </div>
        ) : (
          <div className="divide-y divide-[--color-border]">
            {searchResults.map((user) => {
              const requestStatus = getRequestStatus(user.id);
              const isSending = sendingRequestTo === user.id;

              return (
                <div key={user.id} className="p-4 hover:bg-[--color-bg-secondary] transition-colors">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[--color-accent-primary] to-[--color-accent-secondary] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {user.username.charAt(0).toUpperCase()}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[--color-text-primary] truncate">
                        @{user.username}
                      </div>
                      {user.full_name && (
                        <div className="text-sm text-[--color-text-secondary] truncate">
                          {user.full_name}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {user.branch && (
                          <span className="text-xs text-[--color-text-tertiary]">{user.branch}</span>
                        )}
                        {user.year && (
                          <span className="text-xs text-[--color-text-tertiary]">Year {user.year}</span>
                        )}
                        {user.cookie_score > 0 && (
                          <span className="text-xs font-medium text-[--color-accent-primary]">
                            🍪 {user.cookie_score}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex-shrink-0">
                      {requestStatus === 'sent' ? (
                        <button
                          disabled
                          className="px-4 py-2 bg-[--color-bg-secondary] text-[--color-text-secondary] rounded-lg text-sm font-medium cursor-not-allowed"
                        >
                          Pending
                        </button>
                      ) : requestStatus === 'received' ? (
                        <button
                          disabled
                          className="px-4 py-2 bg-[--color-info]/20 text-[--color-info] rounded-lg text-sm font-medium cursor-not-allowed"
                        >
                          Sent you request
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSendRequest(user.id)}
                          disabled={isSending}
                          className="px-4 py-2 bg-[--color-accent-primary] text-white rounded-lg text-sm font-medium hover:bg-[--color-accent-primary-hover] disabled:opacity-50 transition-all active:scale-95"
                        >
                          {isSending ? 'Sending...' : 'Add Friend'}
                        </button>
                      )}
                    </div>
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

export default SearchPanel;
