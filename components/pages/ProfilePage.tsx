import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import type { User, Profile, Friend } from '../../types';
import * as supabaseService from '../../lib/supabaseService';

// Components
import CookieScoreDashboard from '../profile/CookieScoreDashboard';
import SkillTiles from '../profile/SkillTiles';
import InterestTiles from '../profile/InterestTiles';

interface ProfilePageProps {
    user: User;
    onLogout: () => void;
    onError: (msg: string) => void;
    onSuccess: (msg: string) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onLogout, onError, onSuccess }) => {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    // Edit form state
    const [editForm, setEditForm] = useState({
        bio: '',
        branch: '',
        year: 2025,
        gender: 'prefer_not_to_say'
    });

    // Vouch history for dashboard
    const [vouchHistory, setVouchHistory] = useState<any[]>([]);

    useEffect(() => {
        loadProfileData();
    }, [user.id]);

    const loadProfileData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Profile
            const { data: profileData, error: profileError } = await supabaseService.fetchProfile(user.id);
            if (profileError) throw profileError;

            if (profileData) {
                setProfile(profileData);
                setEditForm({
                    bio: profileData.bio || '',
                    branch: profileData.branch || 'Computer Science',
                    year: profileData.year || 2025,
                    gender: profileData.gender || 'prefer_not_to_say'
                });
            }

            // 2. Fetch Vouch History (Mock for now, or real if available)
            // In a real app, we'd have a specific endpoint for this
            const { data: vouches } = await supabase
                .from('vouches')
                .select('*, voucher:profiles!voucher_id(username)')
                .eq('receiver_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (vouches) {
                setVouchHistory(vouches.map(v => ({
                    id: v.id,
                    voucherName: v.voucher?.username || 'Unknown',
                    skill: v.skill,
                    points: v.points,
                    timestamp: new Date(v.created_at)
                })));
            }

        } catch (error: any) {
            console.error('Error loading profile:', error);
            onError('Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!profile) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    bio: editForm.bio,
                    branch: editForm.branch,
                    year: editForm.year,
                    gender: editForm.gender
                })
                .eq('id', user.id);

            if (error) throw error;

            setProfile({ ...profile, ...editForm });
            setIsEditing(false);
            onSuccess('Profile updated successfully');
        } catch (error: any) {
            onError(error.message || 'Failed to update profile');
        }
    };

    const handleUpdateSkills = async (newSkills: string[]) => {
        if (!profile) return;
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ expertise: newSkills })
                .eq('id', user.id);

            if (error) throw error;
            setProfile({ ...profile, expertise: newSkills });
            onSuccess('Skills updated');
        } catch (error) {
            onError('Failed to update skills');
        }
    };

    const handleUpdateInterests = async (newInterests: string[]) => {
        if (!profile) return;
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ interests: newInterests })
                .eq('id', user.id);

            if (error) throw error;
            setProfile({ ...profile, interests: newInterests });
            onSuccess('Interests updated');
        } catch (error) {
            onError('Failed to update interests');
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[--color-accent-primary]"></div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="p-4 text-center text-[--color-text-secondary]">
                Profile not found.
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto bg-[--color-bg-primary] pb-20">
            {/* Header / Cover */}
            <div className="relative h-32 bg-gradient-to-r from-purple-600 to-blue-600">
                <button
                    onClick={onLogout}
                    className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm transition-colors"
                >
                    Sign Out
                </button>
            </div>

            {/* Profile Info */}
            <div className="px-4 -mt-12 mb-6">
                <div className="flex justify-between items-end">
                    <div className="w-24 h-24 rounded-full border-4 border-[--color-bg-primary] bg-[--color-bg-elevated] flex items-center justify-center text-3xl font-bold text-[--color-text-primary] shadow-lg">
                        {profile.username.charAt(0).toUpperCase()}
                    </div>
                    <button
                        onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                        className={`
              px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm
              ${isEditing
                                ? 'bg-[--color-accent-primary] text-white hover:bg-opacity-90'
                                : 'bg-[--color-bg-elevated] text-[--color-text-primary] hover:bg-[--color-bg-secondary] border border-[--color-border]'}
            `}
                    >
                        {isEditing ? 'Save Changes' : 'Edit Profile'}
                    </button>
                </div>

                <div className="mt-4">
                    <h1 className="text-2xl font-bold text-[--color-text-primary]">
                        {profile.username}
                    </h1>

                    {isEditing ? (
                        <div className="mt-4 space-y-3 bg-[--color-bg-elevated] p-4 rounded-xl border border-[--color-border]">
                            <div>
                                <label className="text-xs text-[--color-text-secondary] block mb-1">Bio</label>
                                <textarea
                                    value={editForm.bio}
                                    onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                                    className="w-full bg-[--color-bg-secondary] border border-[--color-border] rounded-lg p-2 text-sm text-[--color-text-primary]"
                                    rows={2}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-[--color-text-secondary] block mb-1">Branch</label>
                                    <input
                                        type="text"
                                        value={editForm.branch}
                                        onChange={e => setEditForm({ ...editForm, branch: e.target.value })}
                                        className="w-full bg-[--color-bg-secondary] border border-[--color-border] rounded-lg p-2 text-sm text-[--color-text-primary]"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-[--color-text-secondary] block mb-1">Year</label>
                                    <input
                                        type="number"
                                        value={editForm.year}
                                        onChange={e => setEditForm({ ...editForm, year: parseInt(e.target.value) })}
                                        className="w-full bg-[--color-bg-secondary] border border-[--color-border] rounded-lg p-2 text-sm text-[--color-text-primary]"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <p className="text-[--color-text-secondary] mt-1 text-sm">
                                {profile.bio || 'No bio yet'}
                            </p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-[--color-text-tertiary]">
                                <span>🎓 {profile.branch}</span>
                                <span>📅 Class of {profile.year}</span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Cookie Score Dashboard */}
            <div className="px-4 mb-6">
                <CookieScoreDashboard
                    score={profile.cookieScore}
                    skillScores={profile.skillScores || {}}
                    vouchHistory={vouchHistory}
                />
            </div>

            {/* Skills & Interests */}
            <div className="space-y-6 px-4">
                <SkillTiles
                    selectedSkills={profile.expertise || []}
                    onSkillsChange={handleUpdateSkills}
                    maxSkills={5}
                />

                <InterestTiles
                    selectedInterests={profile.interests || []}
                    onInterestsChange={handleUpdateInterests}
                    maxInterests={8}
                />
            </div>

            {/* Version Info */}
            <div className="mt-8 mb-4 text-center">
                <p className="text-xs text-[--color-text-tertiary]">
                    vibeX v1.0.0 • IIT Gandhinagar
                </p>
            </div>
        </div>
    );
};

export default ProfilePage;
