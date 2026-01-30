/**
 * Push Analytics - Event Schema & Types
 * 
 * Canonical event model for push notification analytics.
 * Privacy-first: no message text, no sensitive personal content stored.
 */

import { Scope, Priority } from '../config';

// =============================================
// ENUMS
// =============================================

export type PushEventType =
    | 'delivered'
    | 'opened'
    | 'clicked'
    | 'action_completed';

export type ActionType =
    | 'upload_document'
    | 'book_appointment'
    | 'submit_form'
    | 'call_hotline'
    | 'read_details'
    | 'other';

export type TemplateId =
    | 'CITY_JOBCENTER'
    | 'CITY_IMMIGRATION'
    | 'CITY_TERMIN'
    | 'CITY_GENERAL'
    | 'LAND_OFFICIAL'
    | 'DE_FEDERAL';

// =============================================
// EVENT MODEL
// =============================================

export interface PushEvent {
    event_id: string;
    ts: string; // ISO timestamp
    user_hash: string;
    country: 'DE';
    land: string | null;
    city: string | null;
    scope: Scope;
    priority: Priority;
    push_id: string;
    source_id: string;
    dedupe_group: string;
    template_id: TemplateId;
    event_type: PushEventType;
    action_type: ActionType | null;
    meta: Record<string, unknown> | null;
}

// =============================================
// AGGREGATED METRICS MODEL
// =============================================

export interface PushMetricsDaily {
    date: string; // YYYY-MM-DD
    scope: Scope;
    priority: Priority;
    land: string | null;
    city: string | null;
    source_id: string;
    template_id: TemplateId;

    // Counts
    delivered_count: number;
    opened_count: number;
    clicked_count: number;
    action_completed_count: number;

    // Derived rates (computed on query)
    open_rate?: number;
    click_rate?: number;
    action_rate?: number;
    click_to_action_rate?: number;
}

// =============================================
// DEDUPE KEY
// =============================================

export interface EventDedupeKey {
    push_id: string;
    user_hash: string;
    event_type: PushEventType;
}

export function createDedupeKey(event: Pick<PushEvent, 'push_id' | 'user_hash' | 'event_type'>): string {
    return `${event.push_id}|${event.user_hash}|${event.event_type}`;
}

// =============================================
// INPUT TYPES FOR EVENT CREATION
// =============================================

export interface CreatePushEventInput {
    telegramUserId: string; // Will be hashed
    country: 'DE';
    land?: string;
    city?: string;
    scope: Scope;
    priority: Priority;
    push_id: string;
    source_id: string;
    dedupe_group: string;
    template_id: TemplateId;
    event_type: PushEventType;
    action_type?: ActionType;
    meta?: Record<string, unknown>;
}

// =============================================
// DASHBOARD FILTER OPTIONS
// =============================================

export interface MetricsFilter {
    startDate?: string; // YYYY-MM-DD
    endDate?: string;   // YYYY-MM-DD
    scope?: Scope;
    land?: string;
    city?: string;
    priority?: Priority;
    source_id?: string;
    template_id?: TemplateId;
}

export interface MetricsSummary {
    filters: MetricsFilter;
    period: { start: string; end: string };
    totals: {
        delivered: number;
        opened: number;
        clicked: number;
        action_completed: number;
        open_rate: number;
        click_rate: number;
        action_rate: number;
    };
    by_source: Array<{
        source_id: string;
        delivered: number;
        opened: number;
        open_rate: number;
        action_rate: number;
    }>;
    by_city: Array<{
        city: string;
        delivered: number;
        opened: number;
        open_rate: number;
    }>;
    by_land: Array<{
        land: string;
        delivered: number;
        opened: number;
        open_rate: number;
    }>;
}
