// ================================================================
// Session Participation Limits Enforcement
// Ensures users follow the participation rules
// ================================================================

import { supabase } from './supabaseClient';
import type { Session, SessionType, SessionLimits } from '../types';
import { PARTICIPATION_LIMITS } from '../types';

/**
 * Get all active sessions for a user
 */
async function getUserActiveSessions(userId: string): Promise<Session[]> {
    const { data, error } = await supabase
        .from('sessions')
        .select(`
      *,
      session_participants!inner(user_id)
    `)
        .eq('session_participants.user_id', userId)
        .in('status', ['scheduled', 'active']);

    if (error) {
        console.error('Error fetching user sessions:', error);
        return [];
    }

    return data || [];
}

/**
 * Check if user can join a session of given type
 * Returns detailed information about limits
 */
export async function canJoinSession(
    userId: string,
    sessionType: SessionType,
    flow?: 'seeking' | 'offering'
): Promise<SessionLimits> {
    const activeSessions = await getUserActiveSessions(userId);

    // Exclusive session types: vibe, help, cookie
    const exclusiveTypes: SessionType[] = ['vibe', 'help', 'cookie'];

    if (exclusiveTypes.includes(sessionType)) {
        // Check if user is already in an exclusive session
        const currentExclusive = activeSessions.find(s =>
            exclusiveTypes.includes(s.session_type)
        );

        if (currentExclusive) {
            return {
                can_join: false,
                reason: `You can only be in one Vibe, Help, or Cookie session at a time. Leave "${currentExclusive.title}" first.`,
                current_exclusive: currentExclusive,
                current_queries: [],
            };
        }
    }

    // Query type has special limits
    if (sessionType === 'query') {
        const currentQueries = activeSessions.filter(s => s.session_type === 'query');

        // Max 4 queries total
        if (currentQueries.length >= PARTICIPATION_LIMITS.MAX_QUERIES) {
            return {
                can_join: false,
                reason: `Maximum ${PARTICIPATION_LIMITS.MAX_QUERIES} queries at a time. Leave one first.`,
                current_queries: currentQueries,
                can_join: false,
            };
        }

        // Check seeking/offering limits
        if (flow) {
            const sameFlowQueries = currentQueries.filter(s => s.flow === flow);
            const maxForFlow = flow === 'seeking'
                ? PARTICIPATION_LIMITS.MAX_QUERY_SEEKING
                : PARTICIPATION_LIMITS.MAX_QUERY_OFFERING;

            if (sameFlowQueries.length >= maxForFlow) {
                return {
                    can_join: false,
                    reason: `Maximum ${maxForFlow} "${flow}" queries at a time.`,
                    current_queries: currentQueries,
                };
            }
        }
    }

    // All checks passed
    return {
        can_join: true,
        current_queries: activeSessions.filter(s => s.session_type === 'query'),
    };
}

/**
 * Check if user can create a session of given type
 * Same logic as canJoinSession, but for creation
 */
export async function canCreateSession(
    userId: string,
    sessionType: SessionType,
    flow?: 'seeking' | 'offering'
): Promise<SessionLimits> {
    // Creation has same limits as joining
    return canJoinSession(userId, sessionType, flow);
}

/**
 * Get user's current session participation summary
 */
export async function getUserSessionSummary(userId: string): Promise<{
    exclusive_session?: Session;
    queries: Session[];
    seeking_queries: Session[];
    offering_queries: Session[];
    total_active: number;
}> {
    const activeSessions = await getUserActiveSessions(userId);
    const exclusiveTypes: SessionType[] = ['vibe', 'help', 'cookie'];

    const exclusive = activeSessions.find(s => exclusiveTypes.includes(s.session_type));
    const queries = activeSessions.filter(s => s.session_type === 'query');
    const seeking = queries.filter(s => s.flow === 'seeking');
    const offering = queries.filter(s => s.flow === 'offering');

    return {
        exclusive_session: exclusive,
        queries,
        seeking_queries: seeking,
        offering_queries: offering,
        total_active: activeSessions.length,
    };
}

/**
 * Validate session participation before joining
 * Throws error if cannot join
 */
export async function validateSessionJoin(
    userId: string,
    session: Session
): Promise<void> {
    const limits = await canJoinSession(userId, session.session_type, session.flow);

    if (!limits.can_join) {
        throw new Error(limits.reason || 'Cannot join this session');
    }
}

/**
 * Check if user is at their query limit for a specific flow
 */
export async function isAtQueryLimit(
    userId: string,
    flow: 'seeking' | 'offering'
): Promise<boolean> {
    const summary = await getUserSessionSummary(userId);
    const maxForFlow = flow === 'seeking'
        ? PARTICIPATION_LIMITS.MAX_QUERY_SEEKING
        : PARTICIPATION_LIMITS.MAX_QUERY_OFFERING;

    const currentCount = flow === 'seeking'
        ? summary.seeking_queries.length
        : summary.offering_queries.length;

    return currentCount >= maxForFlow;
}
