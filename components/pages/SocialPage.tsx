import React, { useState } from 'react';
import FriendsPanel from '../social/FriendsPanel';
import TagsPanel from '../social/TagsPanel';
import AssignTagModal from '../social/AssignTagModal';
import type { Friend, Tag } from '../../types';

interface SocialPageProps {
    currentUserId: string;
    friends: Friend[];
    tags: Tag[];
    onRefreshFriends: () => void;
    onRefreshTags: () => void;
    onError: (message: string) => void;
    onSuccess: (message: string) => void;
}

const SocialPage: React.FC<SocialPageProps> = ({
    currentUserId,
    friends,
    tags,
    onRefreshFriends,
    onRefreshTags,
    onError,
    onSuccess,
}) => {
    const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);

    const handleAssignTags = (friend: Friend) => {
        setSelectedFriend(friend);
    };

    const handleCloseTagModal = () => {
        setSelectedFriend(null);
    };

    const handleRefresh = () => {
        onRefreshFriends();
        onRefreshTags();
    };

    return (
        <div className="h-full bg-[--color-bg-primary] flex">
            {/* Friends Panel (Left) */}
            <div className="flex-1 border-r border-[--color-border] overflow-hidden">
                <FriendsPanel
                    currentUserId={currentUserId}
                    friends={friends}
                    onRefresh={onRefreshFriends}
                    onAssignTags={handleAssignTags}
                />
            </div>

            {/* Tags Panel (Right) */}
            <div className="w-80 overflow-hidden">
                <TagsPanel
                    currentUserId={currentUserId}
                    tags={tags}
                    onRefresh={onRefreshTags}
                    onEditMembers={handleAssignTags}
                    onError={onError}
                    onSuccess={onSuccess}
                />
            </div>

            {/* Assign Tag Modal */}
            <AssignTagModal
                isOpen={selectedFriend !== null}
                onClose={handleCloseTagModal}
                friend={selectedFriend}
                allTags={tags}
                onRefresh={handleRefresh}
                onError={onError}
                onSuccess={onSuccess}
            />
        </div>
    );
};

export default SocialPage;
