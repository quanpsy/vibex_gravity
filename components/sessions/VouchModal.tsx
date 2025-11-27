import React, { useState } from 'react';
import { vouchForUser } from '../../lib/supabaseService';
import { SKILLS } from '../../types';
import type { Session } from '../../types';

interface VouchModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session;
  currentUserId: string;
  participants: Array<{ id: string; username: string }>;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

const VouchModal: React.FC<VouchModalProps> = ({
  isOpen,
  onClose,
  session,
  currentUserId,
  participants,
  onError,
  onSuccess,
}) => {
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedSkill, setSelectedSkill] = useState<string>(session.skill_tag || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVouch = async () => {
    if (!selectedUser || !selectedSkill) {
      onError('Please select a user and skill');
      return;
    }

    setIsSubmitting(true);
    const { data, error } = await vouchForUser(
      session.id,
      currentUserId,
      selectedUser,
      selectedSkill
    );
    setIsSubmitting(false);

    if (error) {
      onError(error.message);
      return;
    }

    onSuccess(`Vouched for ${participants.find(p => p.id === selectedUser)?.username}! They earned ${data?.points || 0} points 🍪`);
    onClose();
  };

  // Filter out current user from participants
  const otherParticipants = participants.filter(p => p.id !== currentUserId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[--color-bg-elevated] rounded-t-3xl sm:rounded-3xl shadow-2xl modal-slide-up-panel">
        {/* Header */}
        <div className="bg-[--color-bg-elevated] border-b border-[--color-border] px-6 py-4 flex items-center justify-between rounded-t-3xl sm:rounded-t-3xl">
          <div>
            <h2 className="text-xl font-bold text-[--color-text-primary]">Vouch for Someone</h2>
            <p className="text-sm text-[--color-text-secondary] mt-1">
              {session.emoji} {session.title}
            </p>
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
        <div className="p-6 space-y-5">
          {/* Info */}
          <div className="p-4 bg-[--color-info]/10 border border-[--color-info]/30 rounded-xl">
            <p className="text-sm text-[--color-text-primary]">
              Vouch for participants who helped you learn! They'll earn Cookie Score points based on how many times you've vouched for them before.
            </p>
          </div>

          {/* Select User */}
          <div>
            <label className="block text-sm font-medium text-[--color-text-primary] mb-2">
              Who do you want to vouch for? <span className="text-[--color-error]">*</span>
            </label>
            {otherParticipants.length === 0 ? (
              <p className="text-sm text-[--color-text-secondary]">No other participants in this session</p>
            ) : (
              <div className="space-y-2">
                {otherParticipants.map((participant) => (
                  <label
                    key={participant.id}
                    className={`
                      flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                      ${selectedUser === participant.id
                        ? 'border-[--color-accent-primary] bg-[--color-accent-primary]/10'
                        : 'border-[--color-border] hover:border-[--color-accent-primary]/50'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="participant"
                      value={participant.id}
                      checked={selectedUser === participant.id}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="w-5 h-5"
                    />
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[--color-accent-primary] to-[--color-accent-secondary] flex items-center justify-center text-white font-bold">
                      {participant.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-[--color-text-primary]">
                        @{participant.username}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Select Skill */}
          <div>
            <label className="block text-sm font-medium text-[--color-text-primary] mb-2">
              What skill did they help with? <span className="text-[--color-error]">*</span>
            </label>
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="w-full px-4 py-3 bg-[--color-bg-secondary] border border-[--color-border] rounded-lg text-[--color-text-primary] focus:outline-none focus:ring-2 focus:ring-[--color-accent-primary]"
            >
              <option value="">Select skill</option>
              {SKILLS.map((skill) => (
                <option key={skill} value={skill}>{skill}</option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleVouch}
            disabled={!selectedUser || !selectedSkill || isSubmitting || otherParticipants.length === 0}
            className="w-full py-4 bg-[--color-accent-primary] text-white font-semibold rounded-xl hover:bg-[--color-accent-primary-hover] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? 'Vouching...' : 'Submit Vouch 🍪'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VouchModal;