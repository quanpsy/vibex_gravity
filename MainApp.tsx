import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import type { AppTab, SessionType, Session, Friend, Tag, Conversation, Notification } from './types';
import { DEFAULT_CAMPUS_COORDS, CAMPUS_ZONES, CampusZoneName } from './lib/campusConfig';

// Layout Components
import Header from './components/layout/Header';
import BottomNavBar from './components/layout/BottomNavBar';

// Page Components
import HomePage from './components/pages/HomePage';
import SearchPage from './components/pages/SearchPage';
import SocialPage from './components/pages/SocialPage';
import MessagesPage from './components/pages/MessagesPage';
import ProfilePage from './components/pages/ProfilePage';

// Feature Components
import MapView, { MapViewRef } from './components/map/MapView';

// Modals
import CreateSessionModal from './components/sessions/CreateSessionModal';
import VouchModal from './components/sessions/VouchModal';

// Services
import * as supabaseService from './lib/supabaseService';

interface MainAppProps {
    user: any; // Using any temporarily to match the User type from App.tsx
    onLogout: () => void;
    onProfileUpdate: (updatedProfile: any) => void;
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
}

const MainApp: React.FC<MainAppProps> = ({ user, onLogout, onProfileUpdate, theme, setTheme }) => {
    // Navigation
    const [activeTab, setActiveTab] = useState<AppTab>('Home');

    // Data
    const [sessions, setSessions] = useState<Session[]>([]);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [activeSession, setActiveSession] = useState<Session | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

    // Map State
    const mapRef = useRef<MapViewRef>(null);
    const [activeFilter, setActiveFilter] = useState<CampusZoneName>('Hostels');

    // Modals
    const [showCreateSession, setShowCreateSession] = useState(false);
    const [createSessionType, setCreateSessionType] = useState<SessionType | null>(null);
    const [showVouchModal, setShowVouchModal] = useState(false);
    const [vouchSession, setVouchSession] = useState<Session | null>(null);

    // Toast notifications
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

    // Load initial data
    useEffect(() => {
        loadInitialData();

        // Get user location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                },
                (error) => {
                    console.error('Error getting location:', error);
                    // Default to IIT Gandhinagar coordinates
                    setUserLocation({ lat: 23.2156, lng: 72.6369 });
                }
            );
        } else {
            // Default location
            setUserLocation({ lat: 23.2156, lng: 72.6369 });
        }

        // Set up Realtime Subscription
        const subscription = supabase
            .channel('public:sessions')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, (payload) => {
                console.log('Realtime update:', payload);
                loadInitialData(); // Refresh data on change
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    const loadInitialData = async () => {
        try {
            // Load sessions, friends, and tags in parallel
            const [sessionsRes, friendsRes, tagsRes] = await Promise.all([
                supabaseService.fetchVisibleSessions(user.id),
                supabaseService.fetchFriends(user.id),
                supabaseService.fetchTags(user.id),
            ]);

            if (sessionsRes.data) {
                setSessions(sessionsRes.data);
                // Check if user is in an active session
                const current = sessionsRes.data.find(s =>
                    s.status === 'active' && s.participants.includes(user.id)
                );
                setActiveSession(current || null);
            }
            if (friendsRes.data) setFriends(friendsRes.data);
            if (tagsRes.data) setTags(tagsRes.data);
        } catch (error) {
            console.error('Error loading data:', error);
            showToast('Failed to load data', 'error');
        }
    };

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToastMessage(message);
        setToastType(type);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const handleCreateSession = (type: SessionType) => {
        setCreateSessionType(type);
        setShowCreateSession(true);
    };

    const handleSessionCreated = async (formData: any) => {
        try {
            const { data, error } = await supabaseService.createSession(formData, user.id);

            if (error) throw error;

            if (data) {
                setSessions(prev => [data, ...prev]);
                setActiveSession(data);
                showToast('Session created!', 'success');

                // Fly map to new session
                if (mapRef.current) {
                    mapRef.current.flyToSession(data);
                }
            }

            setShowCreateSession(false);
        } catch (error: any) {
            showToast(error.message, 'error');
        }
    };

    const handleJoinSession = async (sessionId: number, role?: 'seeking' | 'offering' | 'participant' | 'giver') => {
        try {
            const { error } = await supabaseService.joinSession(sessionId, user.id, role);
            if (error) throw error;
            showToast('Joined session!', 'success');
            loadInitialData();
        } catch (error: any) {
            showToast(error.message, 'error');
        }
    };

    const handleLeaveSession = async (sessionId: number) => {
        try {
            const sessionToLeave = sessions.find(s => s.id === sessionId);
            const { error } = await supabaseService.leaveSession(sessionId, user.id);
            if (error) throw error;

            showToast('Left session', 'info');
            setActiveSession(null);
            loadInitialData();

            // If it was a Cookie session, trigger vouch modal
            if (sessionToLeave?.session_type === 'cookie') {
                setVouchSession(sessionToLeave);
                setShowVouchModal(true);
            }
        } catch (error: any) {
            showToast(error.message, 'error');
        }
    };

    const handleExtendSession = async (sessionId: number, minutes: number) => {
        // TODO: Implement extend session logic in service
        showToast('Extension coming soon!', 'info');
    };

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        document.documentElement.className = newTheme;
    };

    const handleRefreshFriends = async () => {
        const { data } = await supabaseService.fetchFriends(user.id);
        if (data) setFriends(data);
    };

    const handleRefreshTags = async () => {
        const { data } = await supabaseService.fetchTags(user.id);
        if (data) setTags(data);
    };

    return (
        <div className={theme}>
            {/* Toast Notification */}
            {toastMessage && (
                <div className={`
          fixed top-20 left-1/2 -translate-x-1/2 z-[9999]
          px-6 py-3 rounded-lg shadow-lg
          ${toastType === 'success' ? 'bg-green-500' : toastType === 'error' ? 'bg-red-500' : 'bg-blue-500'}
          text-white font-medium
          animate-fade-slide-up
        `}>
                    {toastMessage}
                </div>
            )}

            {/* Header */}
            <Header
                username={user.email?.split('@')[0] || 'User'}
                theme={theme}
                onThemeToggle={toggleTheme}
            />

            {/* Main Content */}
            <div className="pt-14 pb-16 h-screen overflow-hidden bg-[--color-bg-primary]">
                {activeTab === 'Home' && (
                    <HomePage
                        onCreateSession={handleCreateSession}
                        activeSession={activeSession}
                        onActiveSessionTap={() => {
                            if (activeSession && mapRef.current) {
                                mapRef.current.flyToSession(activeSession);
                            }
                        }}
                    >
                        <MapView
                            ref={mapRef}
                            isCreateMode={false}
                            userLocation={userLocation ? [userLocation.lat, userLocation.lng] : null}
                            onSetUserLocation={(coords) => setUserLocation({ lat: coords[0], lng: coords[1] })}
                            onMapClick={() => { }}
                            events={sessions}
                            user={user}
                            friends={friends}
                            activeVibe={activeSession}
                            onCloseEvent={handleLeaveSession}
                            onExtendEvent={handleExtendSession}
                            onJoinVibe={handleJoinSession}
                            onViewChat={() => setActiveTab('Messages')}
                            isVisible={activeTab === 'Home'}
                            activeFilter={activeFilter}
                            campusZones={CAMPUS_ZONES}
                        />
                    </HomePage>
                )}

                {activeTab === 'Search' && (
                    <SearchPage
                        currentUserId={user.id}
                        onError={(msg) => showToast(msg, 'error')}
                        onSuccess={(msg) => showToast(msg, 'success')}
                    />
                )}

                {activeTab === 'Friends' && (
                    <SocialPage
                        currentUserId={user.id}
                        friends={friends}
                        tags={tags}
                        onRefreshFriends={handleRefreshFriends}
                        onRefreshTags={handleRefreshTags}
                        onError={(msg) => showToast(msg, 'error')}
                        onSuccess={(msg) => showToast(msg, 'success')}
                    />
                )}

                {activeTab === 'Messages' && (
                    <MessagesPage
                        currentUserId={user.id}
                        onError={(msg) => showToast(msg, 'error')}
                    />
                )}

                {activeTab === 'Profile' && (
                    <ProfilePage
                        user={user}
                        onLogout={onLogout}
                        onError={(msg) => showToast(msg, 'error')}
                        onSuccess={(msg) => showToast(msg, 'success')}
                    />
                )}
            </div>

            {/* Bottom Navigation */}
            <BottomNavBar
                activeTab={activeTab}
                onTabClick={setActiveTab}
                unreadCount={0} // TODO: Calculate from messages
            />

            {/* Create Session Modal */}
            {showCreateSession && createSessionType && userLocation && (
                <CreateSessionModal
                    isOpen={showCreateSession}
                    onClose={() => setShowCreateSession(false)}
                    onCreate={handleSessionCreated}
                    sessionType={createSessionType}
                    userLocation={userLocation}
                    userTags={tags}
                    recentEmojis={[]} // TODO: Fetch from DB
                    userGender="other" // TODO: Get from user profile
                />
            )}

            {/* Vouch Modal */}
            {showVouchModal && vouchSession && (
                <VouchModal
                    isOpen={showVouchModal}
                    onClose={() => setShowVouchModal(false)}
                    session={vouchSession}
                    currentUserId={user.id}
                    participants={vouchSession.participants || []}
                    onError={(msg) => showToast(msg, 'error')}
                    onSuccess={(msg) => showToast(msg, 'success')}
                />
            )}
        </div>
    );
};

export default MainApp;
