import React, { useState, useEffect } from 'react';
import EmojiPicker from '../common/EmojiPicker';
import type {
    SessionType,
    SessionFlow,
    HelpCategory,
    CreateSessionFormData,
    Tag,
    Gender,
    GenderFilter,
} from '../../types';
import { DURATION_OPTIONS, START_DELAY_OPTIONS, SKILLS, BRANCHES } from '../../types';

interface CreateSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (formData: CreateSessionFormData) => Promise<void>;
    sessionType: SessionType;
    userLocation: { lat: number; lng: number };
    userTags: Tag[];
    recentEmojis: string[];
    userGender?: Gender;
}

const CreateSessionModal: React.FC<CreateSessionModalProps> = ({
    isOpen,
    onClose,
    onCreate,
    sessionType,
    userLocation,
    userTags,
    recentEmojis,
    userGender,
}) => {
    const [formData, setFormData] = useState<Partial<CreateSessionFormData>>({
        session_type: sessionType,
        lat: userLocation.lat,
        lng: userLocation.lng,
        duration: 60,
        start_delay: 0,
        privacy: 'public',
        gender_filter: 'all',
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form when modal opens/closes or session type changes
    useEffect(() => {
        if (isOpen) {
            setFormData({
                session_type: sessionType,
                lat: userLocation.lat,
                lng: userLocation.lng,
                duration: 60,
                start_delay: 0,
                privacy: 'public',
                gender_filter: 'all',
                title: '',
                description: '',
                emoji: '',
            });
            setErrors({});
        }
    }, [isOpen, sessionType, userLocation]);

    const validate = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.title?.trim()) {
            newErrors.title = 'Title is required';
        } else if (formData.title.length > 100) {
            newErrors.title = 'Title must be 100 characters or less';
        }

        if (formData.description && formData.description.length > 500) {
            newErrors.description = 'Description must be 500 characters or less';
        }

        if (!formData.emoji) {
            newErrors.emoji = 'Please select an emoji';
        }

        // Type-specific validation
        if (sessionType === 'help' || sessionType === 'cookie' || sessionType === 'query') {
            if (!formData.flow) {
                newErrors.flow = 'Please select an option';
            }
        }

        if (sessionType === 'help' && !formData.help_category) {
            newErrors.help_category = 'Please select a category';
        }

        if (sessionType === 'cookie' && !formData.skill_tag) {
            newErrors.skill_tag = 'Please select a skill';
        }

        if (sessionType === 'query' && formData.flow === 'seeking' && !formData.return_time) {
            newErrors.return_time = 'Please specify return time';
        }

        if (formData.privacy === 'private' && (!formData.visible_to_tags || formData.visible_to_tags.length === 0)) {
            newErrors.visible_to_tags = 'Please select at least one tag';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setIsSubmitting(true);
        try {
            await onCreate(formData as CreateSessionFormData);
            onClose();
        } catch (error: any) {
            setErrors({ submit: error.message || 'Failed to create session' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getTitle = () => {
        const titles = {
            vibe: 'Create a Vibe',
            help: 'Ask for Help',
            cookie: 'Share Your Skills',
            query: 'Post a Query',
        };
        return titles[sessionType];
    };

    const getFlowOptions = () => {
        const options = {
            help: [
                { value: 'seeking', label: 'I need help' },
                { value: 'offering', label: 'I can help' },
            ],
            cookie: [
                { value: 'offering', label: 'I want to teach' },
            ],
            query: [
                { value: 'seeking', label: 'I need an item' },
                { value: 'offering', label: 'I can lend an item' },
            ],
        };
        return options[sessionType as 'help' | 'cookie' | 'query'] || [];
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-[--color-bg-elevated] rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto modal-slide-up-panel">
                {/* Header */}
                <div className="sticky top-0 bg-[--color-bg-elevated] border-b border-[--color-border] px-6 py-4 flex items-center justify-between z-10">
                    <h2 className="text-xl font-bold text-[--color-text-primary]">{getTitle()}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[--color-bg-secondary] rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Flow Selection (Help, Cookie, Query) */}
                    {(sessionType === 'help' || sessionType === 'cookie' || sessionType === 'query') && (
                        <div>
                            <label className="block text-sm font-medium text-[--color-text-primary] mb-2">
                                What do you want to do?
                            </label>
                            <div className="space-y-2">
                                {getFlowOptions().map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, flow: option.value as SessionFlow })}
                                        className={`
                      w-full p-4 rounded-xl border-2 text-left transition-all
                      ${formData.flow === option.value
                                                ? 'border-[--color-accent-primary] bg-[--color-accent-primary]/10'
                                                : 'border-[--color-border] hover:border-[--color-accent-primary]/50'
                                            }
                    `}
                                    >
                                        <div className="font-medium text-[--color-text-primary]">{option.label}</div>
                                    </button>
                                ))}
                            </div>
                            {errors.flow && <p className="text-sm text-[--color-error] mt-1">{errors.flow}</p>}
                        </div>
                    )}

                    {/* Help Category */}
                    {sessionType === 'help' && formData.flow && (
                        <div>
                            <label className="block text-sm font-medium text-[--color-text-primary] mb-2">
                                Category
                            </label>
                            <select
                                value={formData.help_category || ''}
                                onChange={(e) => setFormData({ ...formData, help_category: e.target.value as HelpCategory })}
                                className="w-full px-4 py-3 bg-[--color-bg-secondary] border border-[--color-border] rounded-lg text-[--color-text-primary] focus:outline-none focus:ring-2 focus:ring-[--color-accent-primary]"
                            >
                                <option value="">Select category</option>
                                <option value="Academic">Academic</option>
                                <option value="Project">Project</option>
                                <option value="Tech">Tech</option>
                                <option value="General">General</option>
                            </select>
                            {errors.help_category && <p className="text-sm text-[--color-error] mt-1">{errors.help_category}</p>}
                        </div>
                    )}

                    {/* Skill Selection (Cookie) */}
                    {sessionType === 'cookie' && formData.flow && (
                        <div>
                            <label className="block text-sm font-medium text-[--color-text-primary] mb-2">
                                Skill
                            </label>
                            <select
                                value={formData.skill_tag || ''}
                                onChange={(e) => setFormData({ ...formData, skill_tag: e.target.value })}
                                className="w-full px-4 py-3 bg-[--color-bg-secondary] border border-[--color-border] rounded-lg text-[--color-text-primary] focus:outline-none focus:ring-2 focus:ring-[--color-accent-primary]"
                            >
                                <option value="">Select skill</option>
                                {SKILLS.map((skill) => (
                                    <option key={skill} value={skill}>{skill}</option>
                                ))}
                            </select>
                            {errors.skill_tag && <p className="text-sm text-[--color-error] mt-1">{errors.skill_tag}</p>}
                        </div>
                    )}

                    {/* Return Time (Query - Seeking) */}
                    {sessionType === 'query' && formData.flow === 'seeking' && (
                        <div>
                            <label className="block text-sm font-medium text-[--color-text-primary] mb-2">
                                When will you return it?
                            </label>
                            <input
                                type="datetime-local"
                                value={formData.return_time || ''}
                                onChange={(e) => setFormData({ ...formData, return_time: e.target.value })}
                                min={new Date().toISOString().slice(0, 16)}
                                className="w-full px-4 py-3 bg-[--color-bg-secondary] border border-[--color-border] rounded-lg text-[--color-text-primary] focus:outline-none focus:ring-2 focus:ring-[--color-accent-primary]"
                            />
                            {errors.return_time && <p className="text-sm text-[--color-error] mt-1">{errors.return_time}</p>}
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-[--color-text-primary] mb-2">
                            Title <span className="text-[--color-error]">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.title || ''}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="What's this about?"
                            maxLength={100}
                            className="w-full px-4 py-3 bg-[--color-bg-secondary] border border-[--color-border] rounded-lg text-[--color-text-primary] placeholder-[--color-text-tertiary] focus:outline-none focus:ring-2 focus:ring-[--color-accent-primary]"
                        />
                        <div className="flex justify-between mt-1">
                            {errors.title && <p className="text-sm text-[--color-error]">{errors.title}</p>}
                            <p className="text-xs text-[--color-text-tertiary] ml-auto">{formData.title?.length || 0}/100</p>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-[--color-text-primary] mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Add more details..."
                            maxLength={500}
                            rows={3}
                            className="w-full px-4 py-3 bg-[--color-bg-secondary] border border-[--color-border] rounded-lg text-[--color-text-primary] placeholder-[--color-text-tertiary] focus:outline-none focus:ring-2 focus:ring-[--color-accent-primary] resize-none"
                        />
                        <div className="flex justify-between mt-1">
                            {errors.description && <p className="text-sm text-[--color-error]">{errors.description}</p>}
                            <p className="text-xs text-[--color-text-tertiary] ml-auto">{formData.description?.length || 0}/500</p>
                        </div>
                    </div>

                    {/* Emoji Picker */}
                    <div>
                        <label className="block text-sm font-medium text-[--color-text-primary] mb-2">
                            Choose an emoji <span className="text-[--color-error]">*</span>
                        </label>
                        <EmojiPicker
                            onSelect={(emoji) => setFormData({ ...formData, emoji })}
                            recentEmojis={recentEmojis}
                            selectedEmoji={formData.emoji}
                        />
                        {errors.emoji && <p className="text-sm text-[--color-error] mt-1">{errors.emoji}</p>}
                    </div>

                    {/* Duration */}
                    <div>
                        <label className="block text-sm font-medium text-[--color-text-primary] mb-2">
                            Duration
                        </label>
                        <div className="flex gap-2">
                            {DURATION_OPTIONS.map((duration) => (
                                <button
                                    key={duration}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, duration })}
                                    className={`
                    flex-1 py-3 rounded-lg font-medium transition-all
                    ${formData.duration === duration
                                            ? 'bg-[--color-accent-primary] text-white'
                                            : 'bg-[--color-bg-secondary] text-[--color-text-primary] hover:bg-[--color-bg-tertiary]'
                                        }
                  `}
                                >
                                    {duration < 60 ? `${duration}min` : `${duration / 60}hr`}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Start Time */}
                    <div>
                        <label className="block text-sm font-medium text-[--color-text-primary] mb-2">
                            Start Time
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {START_DELAY_OPTIONS.map((delay) => (
                                <button
                                    key={delay}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, start_delay: delay })}
                                    className={`
                    py-3 rounded-lg font-medium transition-all text-sm
                    ${formData.start_delay === delay
                                            ? 'bg-[--color-accent-primary] text-white'
                                            : 'bg-[--color-bg-secondary] text-[--color-text-primary] hover:bg-[--color-bg-tertiary]'
                                        }
                  `}
                                >
                                    {delay === 0 ? 'Now' : delay < 60 ? `${delay}min` : `${delay / 60}hr`}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Privacy (Vibe only) */}
                    {sessionType === 'vibe' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-[--color-text-primary] mb-2">
                                    Privacy
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, privacy: 'public', visible_to_tags: [] })}
                                        className={`
                      flex-1 py-3 rounded-lg font-medium transition-all
                      ${formData.privacy === 'public'
                                                ? 'bg-[--color-accent-primary] text-white'
                                                : 'bg-[--color-bg-secondary] text-[--color-text-primary] hover:bg-[--color-bg-tertiary]'
                                            }
                    `}
                                    >
                                        Public
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, privacy: 'private' })}
                                        className={`
                      flex-1 py-3 rounded-lg font-medium transition-all
                      ${formData.privacy === 'private'
                                                ? 'bg-[--color-accent-primary] text-white'
                                                : 'bg-[--color-bg-secondary] text-[--color-text-primary] hover:bg-[--color-bg-tertiary]'
                                            }
                    `}
                                    >
                                        Private
                                    </button>
                                </div>
                            </div>

                            {/* Tag Selection (Private Vibe) */}
                            {formData.privacy === 'private' && (
                                <div>
                                    <label className="block text-sm font-medium text-[--color-text-primary] mb-2">
                                        Visible to tags
                                    </label>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {userTags.length === 0 ? (
                                            <p className="text-sm text-[--color-text-secondary]">
                                                No tags created yet. Create tags in the Friends page.
                                            </p>
                                        ) : (
                                            userTags.map((tag) => (
                                                <label
                                                    key={tag.id}
                                                    className="flex items-center gap-3 p-3 rounded-lg bg-[--color-bg-secondary] hover:bg-[--color-bg-tertiary] cursor-pointer transition-colors"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.visible_to_tags?.includes(tag.id) || false}
                                                        onChange={(e) => {
                                                            const tags = formData.visible_to_tags || [];
                                                            if (e.target.checked) {
                                                                setFormData({ ...formData, visible_to_tags: [...tags, tag.id] });
                                                            } else {
                                                                setFormData({ ...formData, visible_to_tags: tags.filter(t => t !== tag.id) });
                                                            }
                                                        }}
                                                        className="w-4 h-4"
                                                    />
                                                    <span className="text-lg">{tag.emoji}</span>
                                                    <span className="font-medium text-[--color-text-primary]">{tag.name}</span>
                                                    <span className="text-xs text-[--color-text-tertiary] ml-auto">
                                                        {tag.member_count} {tag.member_count === 1 ? 'friend' : 'friends'}
                                                    </span>
                                                </label>
                                            ))
                                        )}
                                    </div>
                                    {errors.visible_to_tags && <p className="text-sm text-[--color-error] mt-1">{errors.visible_to_tags}</p>}
                                </div>
                            )}

                            {/* Gender Filter (Public Vibe) */}
                            {formData.privacy === 'public' && userGender && userGender !== 'other' && (
                                <div>
                                    <label className="block text-sm font-medium text-[--color-text-primary] mb-2">
                                        Who can join?
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, gender_filter: 'all' })}
                                            className={`
                        flex-1 py-3 rounded-lg font-medium transition-all
                        ${formData.gender_filter === 'all'
                                                    ? 'bg-[--color-accent-primary] text-white'
                                                    : 'bg-[--color-bg-secondary] text-[--color-text-primary] hover:bg-[--color-bg-tertiary]'
                                                }
                      `}
                                        >
                                            Everyone
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, gender_filter: 'same_only' })}
                                            className={`
                        flex-1 py-3 rounded-lg font-medium transition-all
                        ${formData.gender_filter === 'same_only'
                                                    ? 'bg-[--color-accent-primary] text-white'
                                                    : 'bg-[--color-bg-secondary] text-[--color-text-primary] hover:bg-[--color-bg-tertiary]'
                                                }
                      `}
                                        >
                                            {userGender === 'male' ? 'Males' : 'Females'} Only
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Submit Error */}
                    {errors.submit && (
                        <div className="p-4 bg-[--color-error]/10 border border-[--color-error] rounded-lg">
                            <p className="text-sm text-[--color-error]">{errors.submit}</p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-[--color-accent-primary] text-white font-semibold rounded-xl hover:bg-[--color-accent-primary-hover] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-98"
                    >
                        {isSubmitting ? 'Creating...' : 'Create Session'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateSessionModal;
