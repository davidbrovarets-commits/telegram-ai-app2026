/**
 * Rate Limiting Module for Push Notifications (Supabase Persistent Version)
 * 
 * Enforces max 2 HIGH priority push notifications per user per 24 hours.
 * Uses Supabase for persistent storage (survives server restarts).
 */

import { supabase } from './supabaseClient';

export interface RateLimitRecord {
    user_hash: string;
    high_push_count_24h: number;
    window_start: Date;
    updated_at?: Date;
}

/**
 * Configuration
 */
const RATE_LIMIT_CONFIG = {
    MAX_HIGH_PUSHES_24H: 2,
    WINDOW_DURATION_MS: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * Checks if a push should be allowed based on rate limiting rules.
 * 
 * Rules:
 * - HIGH priority: max 2 per 24 hours
 * - MEDIUM/LOW priority: no limit
 * 
 * @param user_hash - Unique user identifier
 * @param priority - Push priority ('HIGH', 'MEDIUM', 'LOW')
 * @returns Promise with allowed status, reason, and count
 */
export async function checkRateLimit(
    user_hash: string,
    priority: 'HIGH' | 'MEDIUM' | 'LOW'
): Promise<{ allowed: boolean; reason?: string; count?: number }> {
    // Only HIGH priority pushes are rate-limited
    if (priority !== 'HIGH') {
        return { allowed: true, reason: 'MEDIUM/LOW priority bypasses rate limit' };
    }

    try {
        // Fetch current record from database
        const { data, error } = await supabase
            .from('rate_limits')
            .select('*')
            .eq('user_hash', user_hash)
            .single();

        if (error && error.code !== 'PGRST116') {
            // PGRST116 = not found (acceptable)
            console.error('[RateLimit] Database error:', error);
            // Fail open (allow push if DB error)
            return { allowed: true, reason: 'DB error, allowing push', count: 0 };
        }

        // No record exists — first push
        if (!data) {
            return { allowed: true, reason: 'First push for user', count: 0 };
        }

        const record = data as RateLimitRecord;
        const now = new Date();
        const windowStart = new Date(record.window_start);
        const windowExpiry = new Date(windowStart.getTime() + RATE_LIMIT_CONFIG.WINDOW_DURATION_MS);

        // Check if we're outside the 24h window
        if (now >= windowExpiry) {
            // Window expired — will be reset on next recordHighPush
            return { allowed: true, reason: 'Window expired, resetting', count: 0 };
        }

        // Within window — check count
        if (record.high_push_count_24h >= RATE_LIMIT_CONFIG.MAX_HIGH_PUSHES_24H) {
            const timeRemaining = Math.ceil((windowExpiry.getTime() - now.getTime()) / (60 * 60 * 1000));
            return {
                allowed: false,
                reason: `Rate limit exceeded: ${record.high_push_count_24h}/${RATE_LIMIT_CONFIG.MAX_HIGH_PUSHES_24H} HIGH pushes sent. Reset in ${timeRemaining}h`,
                count: record.high_push_count_24h
            };
        }

        // Within limit
        return {
            allowed: true,
            reason: `Within limit: ${record.high_push_count_24h + 1}/${RATE_LIMIT_CONFIG.MAX_HIGH_PUSHES_24H}`,
            count: record.high_push_count_24h
        };

    } catch (err) {
        console.error('[RateLimit] Unexpected error:', err);
        // Fail open (allow push if unexpected error)
        return { allowed: true, reason: 'Unexpected error, allowing push', count: 0 };
    }
}

/**
 * Records a successful HIGH push and increments the counter.
 * Should be called AFTER a HIGH push is successfully sent.
 * 
 * @param user_hash - Unique user identifier
 */
export async function recordHighPush(user_hash: string): Promise<void> {
    try {
        const now = new Date();

        // Fetch current record
        const { data, error: fetchError } = await supabase
            .from('rate_limits')
            .select('*')
            .eq('user_hash', user_hash)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('[RateLimit] Error fetching record:', fetchError);
            return; // Fail silently on error
        }

        if (!data) {
            // Create new record
            const { error: insertError } = await supabase
                .from('rate_limits')
                .insert({
                    user_hash,
                    high_push_count_24h: 1,
                    window_start: now.toISOString()
                });

            if (insertError) {
                console.error('[RateLimit] Error creating record:', insertError);
            }
            return;
        }

        const record = data as RateLimitRecord;
        const windowStart = new Date(record.window_start);
        const windowExpiry = new Date(windowStart.getTime() + RATE_LIMIT_CONFIG.WINDOW_DURATION_MS);

        // Check if window expired
        if (now >= windowExpiry) {
            // Reset window
            const { error: updateError } = await supabase
                .from('rate_limits')
                .update({
                    high_push_count_24h: 1,
                    window_start: now.toISOString()
                })
                .eq('user_hash', user_hash);

            if (updateError) {
                console.error('[RateLimit] Error resetting window:', updateError);
            }
            return;
        }

        // Increment counter within same window
        const { error: updateError } = await supabase
            .from('rate_limits')
            .update({
                high_push_count_24h: record.high_push_count_24h + 1
            })
            .eq('user_hash', user_hash);

        if (updateError) {
            console.error('[RateLimit] Error incrementing counter:', updateError);
        }

    } catch (err) {
        console.error('[RateLimit] Unexpected error recording push:', err);
    }
}

/**
 * Gets current rate limit status for a user (for debugging/monitoring).
 * 
 * @param user_hash - Unique user identifier
 */
export async function getRateLimitStatus(user_hash: string): Promise<{
    count: number;
    limit: number;
    window_start: Date | null;
    window_expiry: Date | null;
}> {
    try {
        const { data, error } = await supabase
            .from('rate_limits')
            .select('*')
            .eq('user_hash', user_hash)
            .single();

        if (error || !data) {
            return {
                count: 0,
                limit: RATE_LIMIT_CONFIG.MAX_HIGH_PUSHES_24H,
                window_start: null,
                window_expiry: null
            };
        }

        const record = data as RateLimitRecord;
        const windowStart = new Date(record.window_start);
        const windowExpiry = new Date(windowStart.getTime() + RATE_LIMIT_CONFIG.WINDOW_DURATION_MS);

        return {
            count: record.high_push_count_24h,
            limit: RATE_LIMIT_CONFIG.MAX_HIGH_PUSHES_24H,
            window_start: windowStart,
            window_expiry: windowExpiry
        };

    } catch (err) {
        console.error('[RateLimit] Error getting status:', err);
        return {
            count: 0,
            limit: RATE_LIMIT_CONFIG.MAX_HIGH_PUSHES_24H,
            window_start: null,
            window_expiry: null
        };
    }
}

/**
 * Clears a specific user's rate limit record (for testing/admin).
 * 
 * @param user_hash - Unique user identifier
 */
export async function clearUserRateLimit(user_hash: string): Promise<void> {
    try {
        const { error } = await supabase
            .from('rate_limits')
            .delete()
            .eq('user_hash', user_hash);

        if (error) {
            console.error('[RateLimit] Error clearing user limit:', error);
        }
    } catch (err) {
        console.error('[RateLimit] Unexpected error clearing limit:', err);
    }
}

/**
 * Clears all rate limit records (for testing only - use with caution!).
 */
export async function clearAllRateLimits(): Promise<void> {
    try {
        const { error } = await supabase
            .from('rate_limits')
            .delete()
            .neq('user_hash', ''); // Delete all records

        if (error) {
            console.error('[RateLimit] Error clearing all limits:', error);
        }
    } catch (err) {
        console.error('[RateLimit] Unexpected error clearing all limits:', err);
    }
}

/**
 * Gets the total number of users being tracked (for monitoring).
 */
export async function getRateLimitStoreSize(): Promise<number> {
    try {
        const { count, error } = await supabase
            .from('rate_limits')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('[RateLimit] Error getting store size:', error);
            return 0;
        }

        return count || 0;
    } catch (err) {
        console.error('[RateLimit] Unexpected error getting store size:', err);
        return 0;
    }
}

/**
 * Cleanup utility: Removes expired records older than 48h (for maintenance).
 * Should be run periodically via cron or manually.
 */
export async function cleanupExpiredRecords(): Promise<number> {
    try {
        const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago

        const { data, error } = await supabase
            .from('rate_limits')
            .delete()
            .lt('window_start', cutoff.toISOString())
            .select();

        if (error) {
            console.error('[RateLimit] Error cleaning up records:', error);
            return 0;
        }

        const deletedCount = data?.length || 0;
        console.log(`[RateLimit] Cleaned up ${deletedCount} expired records`);
        return deletedCount;

    } catch (err) {
        console.error('[RateLimit] Unexpected error during cleanup:', err);
        return 0;
    }
}
