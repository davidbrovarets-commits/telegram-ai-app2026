/**
 * Push Auto-Optimization - State Model
 * 
 * Rule-based optimization for CITY MEDIUM pushes.
 * HIGH priority is NEVER auto-suppressed.
 */

import { Scope, Priority } from '../config';

// =============================================
// STATE TYPES
// =============================================

export type SourceState =
    | 'active'
    | 'soft_suppressed'
    | 'hard_suppressed'
    | 'force_active'      // Manual override: always active
    | 'force_disabled';   // Manual override: always disabled

export type SuppressionReason =
    | 'rule_1_low_action_rate'
    | 'rule_3_chronic_low_value'
    | 'manual_disable'
    | 'recovered'
    | 'manual_enable';

// =============================================
// STATE RECORD
// =============================================

export interface PushSourceState {
    source_id: string;
    scope: Scope;
    priority: Priority;
    state: SourceState;
    last_evaluated_at: string; // ISO timestamp
    reason: SuppressionReason | null;
    consecutive_low_periods: number; // For Rule 3
    metrics_snapshot: MetricsSnapshot;
    manual_override: boolean;
}

export interface MetricsSnapshot {
    evaluation_window_days: number;
    delivered_count: number;
    opened_count: number;
    clicked_count: number;
    action_completed_count: number;
    action_rate: number;
    evaluation_date: string;
}

// =============================================
// AUDIT LOG
// =============================================

export interface AuditLogEntry {
    timestamp: string;
    source_id: string;
    previous_state: SourceState;
    new_state: SourceState;
    rule_triggered: string | null;
    metrics_snapshot: MetricsSnapshot;
    reason: string;
}

// =============================================
// OPTIMIZATION CONFIG (THRESHOLDS)
// =============================================

export const OPTIMIZATION_CONFIG = {
    // Evaluation window
    EVALUATION_WINDOW_DAYS: 14,

    // Minimum data requirements
    MIN_DELIVERED_COUNT: 50,

    // Rule 1: Low performance threshold
    LOW_ACTION_RATE_THRESHOLD: 0.02, // 2%

    // Rule 2: Recovery threshold
    RECOVERY_ACTION_RATE_THRESHOLD: 0.03, // 3%

    // Rule 3: Chronic low value
    CONSECUTIVE_LOW_PERIODS_FOR_HARD_SUPPRESSION: 3,

    // Suppression duration
    SOFT_SUPPRESSION_DAYS: 14,

    // Allowed scope/priority for optimization
    ALLOWED_SCOPE: 'CITY' as Scope,
    ALLOWED_PRIORITY: 'MEDIUM' as Priority,

    // FORBIDDEN: These are NEVER auto-suppressed
    FORBIDDEN_PRIORITIES: ['HIGH'] as Priority[],
    FORBIDDEN_SCOPES: ['DE', 'LAND'] as Scope[],
    FORBIDDEN_SOURCE_PATTERNS: [
        '_jobcenter',
        '_immigration'
    ]
} as const;

// =============================================
// ADMIN ACTIONS
// =============================================

export interface AdminAction {
    action: 'force_active' | 'force_disabled' | 'remove_override';
    source_id: string;
    admin_user: string;
    reason: string;
    timestamp: string;
}
