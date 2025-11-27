import React from 'react';
import { SKILLS, INTERESTS } from '../../types';

interface SkillTilesProps {
    selectedSkills: string[];
    onToggleSkill: (skill: string) => void;
    maxSkills?: number;
}

const SkillTiles: React.FC<SkillTilesProps> = ({ selectedSkills, onToggleSkill, maxSkills = 10 }) => {
    const canAddMore = selectedSkills.length < maxSkills;

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-[--color-text-primary]">
                    Skills & Expertise
                </label>
                <span className="text-xs text-[--color-text-tertiary]">
                    {selectedSkills.length}/{maxSkills}
                </span>
            </div>
            <div className="flex flex-wrap gap-2">
                {SKILLS.map((skill) => {
                    const isSelected = selectedSkills.includes(skill);
                    const isDisabled = !isSelected && !canAddMore;

                    return (
                        <button
                            key={skill}
                            onClick={() => onToggleSkill(skill)}
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
                            {skill}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default SkillTiles;
