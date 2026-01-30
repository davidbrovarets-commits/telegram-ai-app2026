/**
 * Push Auto-Optimization - Rules Engine
 * 
 * Rule-based optimization for CITY MEDIUM pushes.
 * HIGH priority is NEVER auto-suppressed.
 */

import {
    PushSourceState,
    SourceState,
    MetricsSnapshot,
    AuditLogEntry,
    OPTIMIZATION_CONFIG
} from './push-state-model';
import { Scope, Priority } from '../config';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// =============================================
// SAFETY CHECKS
// =============================================

/**
 * Checks if a source can be auto-optimized based on safety rules
 */
export function canAutoOptimize(source_id: string, scope: Scope, priority: Priority): {
    allowed: boolean;
    reason?: string;
} {
    // Rule: HIGH priority is NEVER auto-suppressed
    if (OPTIMIZATION_CONFIG.FORBIDDEN_PRIORITIES.includes(priority)) {
        return { allowed: false, reason: `Priority ${priority} is protected from auto-optimization` };
    }

    // Rule: DE and LAND scopes are NEVER auto-suppressed
    if (OPTIMIZATION_CONFIG.FORBIDDEN_SCOPES.includes(scope)) {
        return { allowed: false, reason: `Scope ${scope} is protected from auto-optimization` };
    }

    // Rule: Jobcenter and Immigration sources are NEVER auto-suppressed
    for (const pattern of OPTIMIZATION_CONFIG.FORBIDDEN_SOURCE_PATTERNS) {
        if (source_id.includes(pattern)) {
            return { allowed: false, reason: `Source pattern '${pattern}' is protected from auto-optimization` };
        }
    }

    // Only CITY + MEDIUM allowed
    if (scope !== OPTIMIZATION_CONFIG.ALLOWED_SCOPE) {
        return { allowed: false, reason: `Only ${OPTIMIZATION_CONFIG.ALLOWED_SCOPE} scope is auto-optimized` };
    }

    if (priority !== OPTIMIZATION_CONFIG.ALLOWED_PRIORITY) {
        return { allowed: false, reason: `Only ${OPTIMIZATION_CONFIG.ALLOWED_PRIORITY} priority is auto-optimized` };
    }

    return { allowed: true };
}

// =============================================
// METRICS CALCULATION
// =============================================

/**
 * Gets metrics for the evaluation window
 */
/**
 * Gets metrics for the evaluation window
 */
export async function getEvaluationMetrics(source_id: string): Promise<MetricsSnapshot | null> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - OPTIMIZATION_CONFIG.EVALUATION_WINDOW_DAYS);

    // Query metrics from DB
    const { data: metrics, error } = await supabase
        .from('push_metrics_daily')
        .select('delivered_count, opened_count, clicked_count, action_completed_count')
        .eq('source_id', source_id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0]);

    if (error) {
        console.error(`Error fetching metrics for ${source_id}:`, error);
        return null;
    }

    if (!metrics || metrics.length === 0) {
        return null;
    }

    // Aggregate metrics across the window
    let delivered = 0;
    let opened = 0;
    let clicked = 0;
    let action_completed = 0;

    for (const m of metrics) {
        delivered += m.delivered_count;
        opened += m.opened_count;
        clicked += m.clicked_count;
        action_completed += m.action_completed_count;
    }

    return {
        evaluation_window_days: OPTIMIZATION_CONFIG.EVALUATION_WINDOW_DAYS,
        delivered_count: delivered,
        opened_count: opened,
        clicked_count: clicked,
        action_completed_count: action_completed,
        action_rate: delivered > 0 ? action_completed / delivered : 0,
        evaluation_date: new Date().toISOString()
    };
}

// =============================================
// OPTIMIZATION RULES
// =============================================

interface EvaluationResult {
    new_state: SourceState;
    rule_triggered: string | null;
    reason: string;
}

/**
 * Evaluates a source and determines its new state
 */
export function evaluateSource(
    source_id: string,
    scope: Scope,
    priority: Priority,
    currentState: PushSourceState | null,
    metrics: MetricsSnapshot
): EvaluationResult {
    // Check if manual override is active
    if (currentState?.manual_override) {
        return {
            new_state: currentState.state,
            rule_triggered: null,
            reason: 'Manual override active - no automatic changes'
        };
    }

    const state = currentState?.state || 'active';
    const consecutiveLow = currentState?.consecutive_low_periods || 0;

    // Check minimum data requirements
    if (metrics.delivered_count < OPTIMIZATION_CONFIG.MIN_DELIVERED_COUNT) {
        return {
            new_state: state === 'active' ? 'active' : state,
            rule_triggered: null,
            reason: `Insufficient data: ${metrics.delivered_count} < ${OPTIMIZATION_CONFIG.MIN_DELIVERED_COUNT} minimum`
        };
    }

    const actionRate = metrics.action_rate;

    // Rule 2: Recovery (check first if soft_suppressed)
    if (state === 'soft_suppressed' && actionRate >= OPTIMIZATION_CONFIG.RECOVERY_ACTION_RATE_THRESHOLD) {
        return {
            new_state: 'active',
            rule_triggered: 'rule_2_recovery',
            reason: `Action rate recovered to ${(actionRate * 100).toFixed(2)}% >= ${OPTIMIZATION_CONFIG.RECOVERY_ACTION_RATE_THRESHOLD * 100}%`
        };
    }

    // Rule 3: Chronic low value (soft_suppressed for 3 consecutive periods)
    if (state === 'soft_suppressed' && actionRate < OPTIMIZATION_CONFIG.LOW_ACTION_RATE_THRESHOLD) {
        const newConsecutive = consecutiveLow + 1;
        if (newConsecutive >= OPTIMIZATION_CONFIG.CONSECUTIVE_LOW_PERIODS_FOR_HARD_SUPPRESSION) {
            return {
                new_state: 'hard_suppressed',
                rule_triggered: 'rule_3_chronic_low_value',
                reason: `Action rate ${(actionRate * 100).toFixed(2)}% < ${OPTIMIZATION_CONFIG.LOW_ACTION_RATE_THRESHOLD * 100}% for ${newConsecutive} consecutive periods`
            };
        }
    }

    // Rule 1: Low performance → soft suppression
    if (state === 'active' && actionRate < OPTIMIZATION_CONFIG.LOW_ACTION_RATE_THRESHOLD) {
        return {
            new_state: 'soft_suppressed',
            rule_triggered: 'rule_1_low_action_rate',
            reason: `Action rate ${(actionRate * 100).toFixed(2)}% < ${OPTIMIZATION_CONFIG.LOW_ACTION_RATE_THRESHOLD * 100}%`
        };
    }

    // No change needed
    return {
        new_state: state,
        rule_triggered: null,
        reason: `No rule triggered. Action rate: ${(actionRate * 100).toFixed(2)}%`
    };
}

// =============================================
// STATE MANAGEMENT
// =============================================

/**
 * Gets the current state of a source
 */
/**
 * Gets the current state of a source
 */
export async function getSourceState(source_id: string): Promise<PushSourceState | null> {
    const { data, error } = await supabase
        .from('push_source_state')
        .select('*')
        .eq('source_id', source_id)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is 'not found'
        console.error(`Error fetching state for ${source_id}:`, error);
    }

    return data as PushSourceState | null;
}

/**
 * Updates the state of a source
 */
/**
 * Updates the state of a source
 */
export async function updateSourceState(
    source_id: string,
    scope: Scope,
    priority: Priority,
    newState: SourceState,
    metrics: MetricsSnapshot,
    ruleTriggered: string | null,
    reason: string
): Promise<PushSourceState | null> {
    const previous = await getSourceState(source_id);
    const previousState = previous?.state || 'active';

    // Calculate consecutive low periods
    let consecutiveLow = previous?.consecutive_low_periods || 0;
    if (newState === 'soft_suppressed' && metrics.action_rate < OPTIMIZATION_CONFIG.LOW_ACTION_RATE_THRESHOLD) {
        consecutiveLow++;
    } else if (newState === 'active') {
        consecutiveLow = 0;
    }

    const stateUpdate = {
        source_id,
        scope,
        priority,
        state: newState,
        last_evaluated_at: new Date().toISOString(),
        reason: ruleTriggered || null,
        consecutive_low_periods: consecutiveLow,
        metrics_snapshot: metrics,
        manual_override: previous?.manual_override || false,
        updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('push_source_state')
        .upsert(stateUpdate)
        .select()
        .single();

    if (error) {
        console.error(`Error updating state for ${source_id}:`, error);
        return null;
    }

    // Log state change if different
    if (previousState !== newState) {
        await logAuditEntry({
            timestamp: new Date().toISOString(),
            source_id,
            previous_state: previousState,
            new_state: newState,
            rule_triggered: ruleTriggered,
            metrics_snapshot: metrics,
            reason
        });
    }

    return data as PushSourceState;
}

/**
 * Checks if a source should receive MEDIUM pushes
 */
export async function shouldSendMediumPush(source_id: string): Promise<{ send: boolean; reason: string }> {
    const state = await getSourceState(source_id);

    if (!state) {
        return { send: true, reason: 'No state record - default to active' };
    }

    switch (state.state) {
        case 'active':
        case 'force_active':
            return { send: true, reason: 'Source is active' };

        case 'soft_suppressed':
        case 'hard_suppressed':
        case 'force_disabled':
            return { send: false, reason: `Source is ${state.state}` };

        default:
            return { send: true, reason: 'Unknown state - default to active' };
    }
}

// =============================================
// AUDIT LOGGING
// =============================================

async function logAuditEntry(entry: AuditLogEntry): Promise<void> {
    const { error } = await supabase
        .from('push_audit_log')
        .insert({
            timestamp: entry.timestamp,
            source_id: entry.source_id,
            previous_state: entry.previous_state,
            new_state: entry.new_state,
            rule_triggered: entry.rule_triggered,
            metrics_snapshot: entry.metrics_snapshot,
            reason: entry.reason
        });

    if (error) {
        console.error('Error logging audit entry:', error);
    } else {
        console.log(`[Optimization Audit] ${entry.source_id}: ${entry.previous_state} → ${entry.new_state} (${entry.reason})`);
    }
}

export async function getAuditLog(): Promise<AuditLogEntry[]> {
    const { data, error } = await supabase
        .from('push_audit_log')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

    if (error) {
        console.error('Error fetching audit log:', error);
        return [];
    }
    return data as AuditLogEntry[];
}

export async function getAuditLogForSource(source_id: string): Promise<AuditLogEntry[]> {
    const { data, error } = await supabase
        .from('push_audit_log')
        .select('*')
        .eq('source_id', source_id)
        .order('timestamp', { ascending: false });

    if (error) {
        console.error(`Error fetching audit log for ${source_id}:`, error);
        return [];
    }
    return data as AuditLogEntry[];
}

// =============================================
// ADMIN CONTROLS
// =============================================

/**
 * Admin override: Force a source to always be active
 */
export async function forceActive(source_id: string, adminUser: string, reason: string): Promise<PushSourceState | null> {
    const current = await getSourceState(source_id);

    // Create new state object or update existing
    const newState: any = {
        source_id,
        state: 'force_active',
        manual_override: true,
        reason: 'manual_enable',
        last_evaluated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    // Preserve existing fields if available
    if (current) {
        newState.scope = current.scope;
        newState.priority = current.priority;
        newState.metrics_snapshot = current.metrics_snapshot;
        newState.consecutive_low_periods = current.consecutive_low_periods;
    } else {
        // If creating new, we need scope/priority. 
        // Admin functions should arguably take scope/priority, but signature is fixed.
        // We will assume they are known or fetch defaults? 
        // Actually, if it's not in DB, we can't really force it active without knowing scope/priority.
        // We'll return null if not found, consistent with original logic.
        return null;
    }

    const { data, error } = await supabase
        .from('push_source_state')
        .upsert(newState)
        .select()
        .single();

    if (error) {
        console.error(`Error forcing active for ${source_id}:`, error);
        return null;
    }

    await logAuditEntry({
        timestamp: new Date().toISOString(),
        source_id,
        previous_state: current.state,
        new_state: 'force_active',
        rule_triggered: null,
        metrics_snapshot: current.metrics_snapshot,
        reason: `Admin override by ${adminUser}: ${reason}`
    });

    return data as PushSourceState;
}

/**
 * Admin override: Force a source to be disabled
 */
export async function forceDisabled(source_id: string, adminUser: string, reason: string): Promise<PushSourceState | null> {
    const current = await getSourceState(source_id);
    if (!current) {
        return null;
    }

    const newState = {
        ...current,
        state: 'force_disabled' as SourceState,
        manual_override: true,
        reason: 'manual_disable' as any,
        updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('push_source_state')
        .upsert(newState)
        .select()
        .single();

    if (error) {
        console.error(`Error forcing disabled for ${source_id}:`, error);
        return null;
    }

    await logAuditEntry({
        timestamp: new Date().toISOString(),
        source_id,
        previous_state: current.state,
        new_state: 'force_disabled',
        rule_triggered: null,
        metrics_snapshot: current.metrics_snapshot,
        reason: `Admin disable by ${adminUser}: ${reason}`
    });

    return data as PushSourceState;
}

/**
 * Admin: Remove manual override
 */
export async function removeOverride(source_id: string, adminUser: string): Promise<PushSourceState | null> {
    const current = await getSourceState(source_id);
    if (!current) {
        return null;
    }

    const newState = {
        ...current,
        state: 'active' as SourceState, // Reset to active for re-evaluation
        manual_override: false,
        updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('push_source_state')
        .upsert(newState)
        .select()
        .single();

    if (error) {
        console.error(`Error removing override for ${source_id}:`, error);
        return null;
    }

    await logAuditEntry({
        timestamp: new Date().toISOString(),
        source_id,
        previous_state: current.state,
        new_state: 'active',
        rule_triggered: null,
        metrics_snapshot: current.metrics_snapshot,
        reason: `Manual override removed by ${adminUser}`
    });

    return data as PushSourceState;
}

// =============================================
// ADMIN VISIBILITY
// =============================================

/**
 * Gets all suppressed sources for admin review
 */
export async function getSuppressedSources(): Promise<PushSourceState[]> {
    const { data, error } = await supabase
        .from('push_source_state')
        .select('*')
        .in('state', ['soft_suppressed', 'hard_suppressed', 'force_disabled']);

    if (error) {
        console.error('Error fetching suppressed sources:', error);
        return [];
    }
    return data as PushSourceState[];
}

/**
 * Gets all source states
 */
export async function getAllSourceStates(): Promise<PushSourceState[]> {
    const { data, error } = await supabase
        .from('push_source_state')
        .select('*');

    if (error) {
        console.error('Error fetching all states:', error);
        return [];
    }
    return data as PushSourceState[];
}

// =============================================
// TESTING HELPERS
// =============================================

export async function clearStateStore(): Promise<void> {
    if (process.env.NODE_ENV !== 'test') {
        console.error('clearStateStore only allowed in test environment');
        return;
    }

    await supabase.from('push_source_state').delete().neq('source_id', 'PLACEHOLDER_TO_DELETE_ALL');
    // Supabase requires filter for delete usually, unless disabled. 
    // Just deleting everything for test.
    // Better strategy:
    const { error } = await supabase.from('push_source_state').delete().gt('last_evaluated_at', '1970-01-01'); // Delete all
    if (error) console.error('Error clearing state store:', error);
}

export async function setSourceStateForTesting(state: PushSourceState): Promise<void> {
    if (process.env.NODE_ENV !== 'test') return;
    await supabase.from('push_source_state').upsert(state);
}
