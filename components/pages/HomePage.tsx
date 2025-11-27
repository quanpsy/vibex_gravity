import React from 'react';
import FloatingActionButton from '../common/FloatingActionButton';
import ActiveSessionIndicator from '../sessions/ActiveSessionIndicator';
import type { Session, SessionType } from '../../types';

interface HomePageProps {
    onCreateSession: (type: SessionType) => void;
    activeSession?: Session;
    onActiveSessionTap?: () => void;
    children: React.ReactNode; // MapView component
}

const HomePage: React.FC<HomePageProps> = ({
    onCreateSession,
    activeSession,
    onActiveSessionTap,
    children,
}) => {
    return (
        <div className="h-full relative bg-[--color-bg-primary]">
            {/* Active Session Indicator */}
            {activeSession && onActiveSessionTap && (
                <ActiveSessionIndicator
                    session={activeSession}
                    onTap={onActiveSessionTap}
                />
            )}

            {/* Map View */}
            <div className={`h-full ${activeSession ? 'pt-16' : ''}`}>
                {children}
            </div>

            {/* Floating Action Button */}
            <FloatingActionButton onSessionTypeSelect={onCreateSession} />
        </div>
    );
};

export default HomePage;
