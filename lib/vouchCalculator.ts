// ================================================================
// Vouch Calculator - F1-style Points System
// Calculates Cookie Score points for vouches
// ================================================================

import { supabase } from './supabaseClient';
import type { VouchPointsResult } from '../types';
import { VOUCH_POINTS, MAX_VOUCHES } from '../types';

/**
 * Calculate points for a vouch based on previous vouches
 * F1-style decreasing points: 10, 7, 5, 2, 1
 */
export async function calculateVouchPoints(
    voucherId: string,
    receiverId: string
): Promise<VouchPointsResult> {
    // Get all previous vouches from this voucher to this receiver
    const { data: previousVouches, error } = await supabase
        .from('vouches')
        .select('*')
        .eq('voucher_id', voucherId)
        .eq('receiver_id', receiverId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching previous vouches:', error);
        return {
            points: 0,
            vouch_number: 1,
            can_vouch: false,
            reason: 'Error checking vouch history',
        };
    }

    const vouchNumber = (previousVouches?.length || 0) + 1;

    // Check if at max vouches
    if (vouchNumber > MAX_VOUCHES) {
        return {
            points: 0,
            vouch_number: vouchNumber,
            can_vouch: false,
            reason: `Maximum ${MAX_VOUCHES} vouches reached for this person`,
        };
    }

    // Get points for this vouch number (1-indexed)
    const points = VOUCH_POINTS[vouchNumber - 1] || 0;

    return {
        points,
        vouch_number: vouchNumber,
        can_vouch: true,
    };
}

/**
 * Create a vouch and update receiver's Cookie Score
 */
export async function createVouch(
    sessionId: number,
    voucherId: string,
    receiverId: string,
    skill: string
): Promise<{ success: boolean; points: number; error?: string }> {
    // Validate: cannot vouch for yourself
    if (voucherId === receiverId) {
        return {
            success: false,
            points: 0,
            error: 'You cannot vouch for yourself',
        };
    }

    // Calculate points
    const pointsResult = await calculateVouchPoints(voucherId, receiverId);

    if (!pointsResult.can_vouch) {
        return {
            success: false,
            points: 0,
            error: pointsResult.reason,
        };
    }

    // Create vouch record
    const { error: vouchError } = await supabase
        .from('vouches')
        .insert({
            session_id: sessionId,
            voucher_id: voucherId,
            receiver_id: receiverId,
            skill,
            points: pointsResult.points,
            vouch_number: pointsResult.vouch_number,
        });

    if (vouchError) {
        console.error('Error creating vouch:', vouchError);
        return {
            success: false,
            points: 0,
            error: 'Failed to create vouch',
        };
    }

    // Update receiver's Cookie Score
    const updateSuccess = await updateCookieScore(receiverId);

    if (!updateSuccess) {
        return {
            success: false,
            points: pointsResult.points,
            error: 'Vouch created but failed to update score',
        };
    }

    return {
        success: true,
        points: pointsResult.points,
    };
}

/**
 * Recalculate and update user's total Cookie Score
 */
export async function updateCookieScore(userId: string): Promise<boolean> {
    // Sum all vouch points received by this user
    const { data: vouches, error: vouchError } = await supabase
        .from('vouches')
        .select('points')
        .eq('receiver_id', userId);

    if (vouchError) {
        console.error('Error fetching vouches:', vouchError);
        return false;
    }

    const totalScore = vouches?.reduce((sum, v) => sum + v.points, 0) || 0;

    // Update profile
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ cookie_score: totalScore })
        .eq('id', userId);

    if (updateError) {
        console.error('Error updating cookie score:', updateError);
        return false;
    }

    return true;
}

/**
 * Get vouch history for a user (received)
 */
export async function getUserVouchHistory(userId: string) {
    const { data, error } = await supabase
        .from('vouches')
        .select(`
      *,
      voucher:voucher_id(username),
      session:session_id(title, emoji)
    `)
        .eq('receiver_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching vouch history:', error);
        return [];
    }

    return data || [];
}

/**
 * Get skill breakdown for a user's Cookie Score
 */
export async function getSkillBreakdown(userId: string): Promise<{ [skill: string]: number }> {
    const { data, error } = await supabase
        .from('vouches')
        .select('skill, points')
        .eq('receiver_id', userId);

    if (error) {
        console.error('Error fetching skill breakdown:', error);
        return {};
    }

    const breakdown: { [skill: string]: number } = {};

    data?.forEach(vouch => {
        if (!breakdown[vouch.skill]) {
            breakdown[vouch.skill] = 0;
        }
        breakdown[vouch.skill] += vouch.points;
    });

    return breakdown;
}

/**
 * Check if user can vouch for another user
 */
export async function canVouchFor(
    voucherId: string,
    receiverId: string
): Promise<{ can_vouch: boolean; reason?: string; next_points?: number }> {
    const result = await calculateVouchPoints(voucherId, receiverId);

    return {
        can_vouch: result.can_vouch,
        reason: result.reason,
        next_points: result.points,
    };
}

/**
 * Get top vouchers for a user (who vouched for them most)
 */
export async function getTopVouchers(userId: string, limit: number = 5) {
    const { data, error } = await supabase
        .from('vouches')
        .select(`
      voucher_id,
      voucher:voucher_id(username),
      points
    `)
        .eq('receiver_id', userId)
        .order('points', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching top vouchers:', error);
        return [];
    }

    // Group by voucher and sum points
    const voucherMap = new Map<string, { username: string; total_points: number }>();

    data?.forEach(vouch => {
        const existing = voucherMap.get(vouch.voucher_id);
        if (existing) {
            existing.total_points += vouch.points;
        } else {
            voucherMap.set(vouch.voucher_id, {
                username: (vouch.voucher as any)?.username || 'Unknown',
                total_points: vouch.points,
            });
        }
    });

    return Array.from(voucherMap.values())
        .sort((a, b) => b.total_points - a.total_points)
        .slice(0, limit);
}
