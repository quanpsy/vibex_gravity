import React from 'react';

// Navigation Icons
const HomeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const FriendsIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const MessagesIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
  </svg>
);

const ProfileIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

export type AppTab = 'Home' | 'Search' | 'Friends' | 'Messages' | 'Profile';

const navItems = [
  { id: 'Home', icon: HomeIcon, label: 'Home' },
  { id: 'Search', icon: SearchIcon, label: 'Search' },
  { id: 'Friends', icon: FriendsIcon, label: 'Friends' },
  { id: 'Messages', icon: MessagesIcon, label: 'Messages' },
  { id: 'Profile', icon: ProfileIcon, label: 'Profile' },
];

interface BottomNavBarProps {
  activeTab: AppTab;
  onTabClick: (tab: AppTab) => void;
  unreadCount?: number; // For messages badge
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, onTabClick, unreadCount = 0 }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[--color-bg-elevated] border-t border-[--color-border] flex justify-around items-center z-50 safe-area-bottom">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        const showBadge = item.id === 'Messages' && unreadCount > 0;

        return (
          <button
            key={item.id}
            onClick={() => onTabClick(item.id as AppTab)}
            className={`
              flex flex-col items-center justify-center w-full h-full
              transition-all duration-200 nav-item-tap relative
              ${isActive ? 'text-[--color-accent-primary]' : 'text-[--color-text-secondary]'}
              hover:text-[--color-accent-primary]
              active:scale-95
            `}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <div className="relative">
              <item.icon className="h-6 w-6" />
              {showBadge && (
                <span className="absolute -top-1 -right-1 bg-[--color-error] text-white text-xs font-bold rounded-full h-4 min-w-[16px] flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <span className={`text-xs font-medium mt-1 ${isActive ? 'font-semibold' : ''}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default React.memo(BottomNavBar);