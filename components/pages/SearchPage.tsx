import React, { useState } from 'react';
import SearchPanel from '../social/SearchPanel';

interface SearchPageProps {
    currentUserId: string;
    onError: (message: string) => void;
    onSuccess: (message: string) => void;
}

const SearchPage: React.FC<SearchPageProps> = ({ currentUserId, onError, onSuccess }) => {
    return (
        <div className="h-full bg-[--color-bg-primary]">
            <SearchPanel
                currentUserId={currentUserId}
                onError={onError}
                onSuccess={onSuccess}
            />
        </div>
    );
};

export default SearchPage;
