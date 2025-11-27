import React from 'react';
import { INTERESTS } from '../../types';

interface InterestTilesProps {
    selectedInterests: string[];
    onToggleInterest: (interest: string) => void;
    maxInterests?: number;
}

const InterestTiles: React.FC<InterestTilesProps> = ({ selectedInterests, onToggleInterest, maxInterests = 10 }) => {
    const canAddMore = selectedInterests.length < maxInterests;

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-[--color-text-primary]">
                    Interests & Hobbies
                </label>
                <span className="text-xs text-[--color-text-tertiary]">
                    {selectedInterests.length}/{maxInterests}
                </span>
            </div>
            <div className="flex flex-wrap gap-2">
                {INTERESTS.map((interest) => {
                    const isSelected = selectedInterests.includes(interest);
                    const isDisabled = !isSelected && !canAddMore;

                    return (
                        <button
                            key={interest}
                            onClick={() => onToggleInterest(interest)}
                            disabled={isDisabled}
                            className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all
                ${isSelected
                                    ? 'bg-[--color-accent-primary] text-white'
                                    : isDisabled
                                        ? 'bg-[--color-bg-tertiary] text-[--color-text-tertiary] cursor-not-allowed'
                                        : 'bg-[--color-bg-secondary] text-[--color-text-primary] hover:bg-[--color-bg-tertiary]'
                                }
              `}
                        >
                            {interest}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default InterestTiles;
