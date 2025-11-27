import React from 'react';
import type { Session } from '../../types';

interface ActiveSessionIndicatorProps {
  session: Session;
  onTap: () => void;
}

const ActiveSessionIndicator: React.FC<ActiveSessionIndicatorProps> = ({ session, onTap }) => {
  // Calculate remaining time
  const getTimeRemaining = () => {
    const endTime = new Date(session.event_time);
    endTime.setMinutes(endTime.getMinutes() + session.duration);
    const now = new Date();
    const diffMs = endTime.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins <= 0) return 'Ending soon';
    if (diffMins < 60) return `${diffMins}min left`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m left`;
  };

  const getSessionTypeColor = () => {
    const colors = {
      vibe: '#8B5CF6', // purple
      help: '#3B82F6', // blue
      cookie: '#F59E0B', // amber
      query: '#10B981', // green
    };
    return colors[session.session_type] || '#8B5CF6';
  };

  return (
    <div
      onClick={onTap}
      className="fixed top-14 left-0 right-0 z-40 bg-[--color-bg-elevated] border-b border-[--color-border] shadow-md cursor-pointer hover:bg-[--color-bg-secondary] transition-colors active-session-indicator"
      style={{ borderTopColor: getSessionTypeColor(), borderTopWidth: '3px' }}
    >
      <div className="px-4 py-2 flex items-center gap-3">
        {/* Emoji with pulse */}
        <div className="relative">
          <div className="text-2xl animate-pulse-slow">{session.emoji}</div>
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[--color-bg-elevated]" />
        </div>

        {/* Session Info */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[--color-text-primary] truncate text-sm">
            {session.title}
          </div>
          <div className="text-xs text-[--color-text-secondary]">
            {session.participant_count || 0} {session.participant_count === 1 ? 'person' : 'people'} • {getTimeRemaining()}
          </div>
        </div>

        {/* Chevron */}
        <svg className="w-5 h-5 text-[--color-text-tertiary] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
};

export default ActiveSessionIndicator;
