import React from 'react';
import type { Vouch } from '../../types';

interface CookieScoreDashboardProps {
  cookieScore: number;
  vouchHistory: Vouch[];
}

const CookieScoreDashboard: React.FC<CookieScoreDashboardProps> = ({ cookieScore, vouchHistory }) => {
  // Group vouches by skill
  const skillBreakdown = vouchHistory.reduce((acc, vouch) => {
    if (!acc[vouch.skill]) {
      acc[vouch.skill] = { count: 0, points: 0 };
    }
    acc[vouch.skill].count++;
    acc[vouch.skill].points += vouch.points;
    return acc;
  }, {} as { [skill: string]: { count: number; points: number } });

  const topSkills = Object.entries(skillBreakdown)
    .sort((a, b) => b[1].points - a[1].points)
    .slice(0, 5);

  // Group vouches by voucher
  const voucherBreakdown = vouchHistory.reduce((acc, vouch) => {
    const username = vouch.voucherUsername;
    if (!acc[username]) {
      acc[username] = { count: 0, points: 0 };
    }
    acc[username].count++;
    acc[username].points += vouch.points;
    return acc;
  }, {} as { [username: string]: { count: number; points: number } });

  const topVouchers = Object.entries(voucherBreakdown)
    .sort((a, b) => b[1].points - a[1].points)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Total Score */}
      <div className="text-center p-6 bg-gradient-to-br from-[--color-accent-primary]/20 to-[--color-accent-secondary]/20 rounded-2xl border-2 border-[--color-accent-primary]/30">
        <div className="text-6xl mb-2">🍪</div>
        <div className="text-4xl font-bold text-[--color-text-primary] mb-1">
          {cookieScore}
        </div>
        <div className="text-sm text-[--color-text-secondary]">Cookie Score</div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-[--color-bg-secondary] rounded-xl">
          <div className="text-2xl font-bold text-[--color-text-primary]">
            {vouchHistory.length}
          </div>
          <div className="text-sm text-[--color-text-secondary]">Total Vouches</div>
        </div>
        <div className="p-4 bg-[--color-bg-secondary] rounded-xl">
          <div className="text-2xl font-bold text-[--color-text-primary]">
            {Object.keys(skillBreakdown).length}
          </div>
          <div className="text-sm text-[--color-text-secondary]">Skills Vouched</div>
        </div>
      </div>

      {/* Top Skills */}
      {topSkills.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-[--color-text-primary] mb-3">Top Skills</h3>
          <div className="space-y-2">
            {topSkills.map(([skill, data], index) => (
              <div key={skill} className="flex items-center gap-3 p-3 bg-[--color-bg-secondary] rounded-lg">
                <div className="w-8 h-8 rounded-full bg-[--color-accent-primary] text-white flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-[--color-text-primary]">{skill}</div>
                  <div className="text-xs text-[--color-text-secondary]">
                    {data.count} {data.count === 1 ? 'vouch' : 'vouches'}
                  </div>
                </div>
                <div className="text-lg font-bold text-[--color-accent-primary]">
                  {data.points}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Vouchers */}
      {topVouchers.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-[--color-text-primary] mb-3">Top Vouchers</h3>
          <div className="space-y-2">
            {topVouchers.map(([username, data], index) => (
              <div key={username} className="flex items-center gap-3 p-3 bg-[--color-bg-secondary] rounded-lg">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[--color-accent-primary] to-[--color-accent-secondary] flex items-center justify-center text-white font-bold">
                  {username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-[--color-text-primary]">@{username}</div>
                  <div className="text-xs text-[--color-text-secondary]">
                    {data.count} {data.count === 1 ? 'vouch' : 'vouches'}
                  </div>
                </div>
                <div className="text-lg font-bold text-[--color-accent-primary]">
                  {data.points}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Vouches */}
      {vouchHistory.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-[--color-text-primary] mb-3">Recent Vouches</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {vouchHistory.slice(0, 10).map((vouch) => (
              <div key={vouch.id} className="p-3 bg-[--color-bg-secondary] rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium text-[--color-text-primary]">
                    @{vouch.voucherUsername}
                  </div>
                  <div className="text-sm font-bold text-[--color-accent-primary]">
                    +{vouch.points}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-[--color-text-secondary]">
                  <span>{vouch.skill}</span>
                  <span>{new Date(vouch.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {vouchHistory.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🍪</div>
          <p className="text-[--color-text-secondary] font-medium">No vouches yet</p>
          <p className="text-sm text-[--color-text-tertiary] mt-1">
            Participate in Cookie sessions to earn vouches!
          </p>
        </div>
      )}
    </div>
  );
};

export default CookieScoreDashboard;