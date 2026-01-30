/**
 * Push Analytics - Daily Aggregation Job
 * 
 * Aggregates raw push events into daily metrics.
 * Run daily via cron or manual invocation.
 */

import {
    PushEvent,
    PushMetricsDaily,
    TemplateId
} from './push-event-schema';
import { getEventsByDateRange } from './push-event-logger';
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
    // We don't exit process here strictly to allow imports in tests/other files without crashing if env missing
    // But runtime will fail.
}

const supabase = createClient(supabaseUrl, supabaseKey);

// =============================================
// AGGREGATION LOGIC
// =============================================

interface AggregationKey {
    date: string;
    scope: Scope;
    priority: Priority;
    land: string | null;
    city: string | null;
    source_id: string;
    template_id: TemplateId;
}

function createAggregationKey(event: PushEvent): string {
    const date = event.ts.split('T')[0]; // Extract YYYY-MM-DD
    return [
        date,
        event.scope,
        event.priority,
        event.land || 'NULL',
        event.city || 'NULL',
        event.source_id,
        event.template_id
    ].join('|');
}

function parseAggregationKey(key: string): AggregationKey {
    const parts = key.split('|');
    return {
        date: parts[0],
        scope: parts[1] as Scope,
        priority: parts[2] as Priority,
        land: parts[3] === 'NULL' ? null : parts[3],
        city: parts[4] === 'NULL' ? null : parts[4],
        source_id: parts[5],
        template_id: parts[6] as TemplateId
    };
}

/**
 * Aggregates events for a given date range into daily metrics
 */
export function aggregateEvents(startDate: Date, endDate: Date): PushMetricsDaily[] {
    const events = getEventsByDateRange(startDate, endDate);

    // Group events by aggregation key
    const groups = new Map<string, PushEvent[]>();

    for (const event of events) {
        const key = createAggregationKey(event);
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key)!.push(event);
    }

    // Calculate metrics for each group
    const metrics: PushMetricsDaily[] = [];

    for (const [key, groupEvents] of groups) {
        const keyData = parseAggregationKey(key);

        // Count unique push_ids per event type
        const deliveredPushIds = new Set<string>();
        const openedPushIds = new Set<string>();
        const clickedPushIds = new Set<string>();
        const actionCompletedPushIds = new Set<string>();

        for (const event of groupEvents) {
            switch (event.event_type) {
                case 'delivered':
                    deliveredPushIds.add(event.push_id);
                    break;
                case 'opened':
                    openedPushIds.add(event.push_id);
                    break;
                case 'clicked':
                    clickedPushIds.add(event.push_id);
                    break;
                case 'action_completed':
                    actionCompletedPushIds.add(event.push_id);
                    break;
            }
        }

        const delivered_count = deliveredPushIds.size;
        const opened_count = openedPushIds.size;
        const clicked_count = clickedPushIds.size;
        const action_completed_count = actionCompletedPushIds.size;

        // Calculate rates
        const open_rate = delivered_count > 0 ? opened_count / delivered_count : 0;
        const click_rate = delivered_count > 0 ? clicked_count / delivered_count : 0;
        const action_rate = delivered_count > 0 ? action_completed_count / delivered_count : 0;
        const click_to_action_rate = clicked_count > 0 ? action_completed_count / clicked_count : 0;

        metrics.push({
            ...keyData,
            delivered_count,
            opened_count,
            clicked_count,
            action_completed_count,
            open_rate,
            click_rate,
            action_rate,
            click_to_action_rate
        });
    }

    return metrics;
}

/**
 * Runs the daily aggregation job for a specific date
 */
export async function runDailyAggregation(date: Date): Promise<PushMetricsDaily[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const metrics = aggregateEvents(startOfDay, endOfDay);

    if (metrics.length === 0) {
        console.log(`[Aggregation] No metrics generated for ${date.toISOString().split('T')[0]}`);
        return [];
    }

    // Prepare rows for DB insertion (remove derived fields if table logic differs, but here schema matches)
    const dbRows = metrics.map(m => ({
        date: m.date,
        scope: m.scope,
        priority: m.priority,
        land: m.land,
        city: m.city,
        source_id: m.source_id,
        template_id: m.template_id,
        delivered_count: m.delivered_count,
        opened_count: m.opened_count,
        clicked_count: m.clicked_count,
        action_completed_count: m.action_completed_count
    }));

    // Upsert to DB
    const { error } = await supabase
        .from('push_metrics_daily')
        .upsert(dbRows);

    if (error) {
        console.error(`[Aggregation] Error upserting metrics: ${error.message}`);
    } else {
        console.log(`[Aggregation] Upserted ${metrics.length} metric groups for ${date.toISOString().split('T')[0]}`);
    }

    return metrics;
}

/**
 * Runs aggregation for all days in a range
 */
export async function runAggregationForRange(startDate: Date, endDate: Date): Promise<PushMetricsDaily[]> {
    const allMetrics: PushMetricsDaily[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        const dayMetrics = await runDailyAggregation(new Date(currentDate));
        allMetrics.push(...dayMetrics);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return allMetrics;
}

// =============================================
// METRICS ACCESS
// =============================================

// Deprecated: No in-memory store anymore. 
// Queries should use Supabase directly or standard helper.
export async function getMetrics(): Promise<PushMetricsDaily[]> {
    const { data } = await supabase.from('push_metrics_daily').select('*');
    return (data || []) as PushMetricsDaily[];
}

// Keeping this for backward compatibility if engine tests mocked it, 
// OR simpler DB query access.
export async function getMetricsByFilter(filter: {
    startDate?: string;
    endDate?: string;
    scope?: Scope;
    land?: string;
    city?: string;
    priority?: Priority;
    source_id?: string;
    template_id?: TemplateId;
}): Promise<PushMetricsDaily[]> {
    let query = supabase.from('push_metrics_daily').select('*');

    if (filter.startDate) query = query.gte('date', filter.startDate);
    if (filter.endDate) query = query.lte('date', filter.endDate);
    if (filter.scope) query = query.eq('scope', filter.scope);
    if (filter.land) query = query.eq('land', filter.land);
    if (filter.city) query = query.eq('city', filter.city);
    if (filter.priority) query = query.eq('priority', filter.priority);
    if (filter.source_id) query = query.eq('source_id', filter.source_id);
    if (filter.template_id) query = query.eq('template_id', filter.template_id);

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching metrics:', error);
        return [];
    }

    return data as PushMetricsDaily[];
}

export function clearMetrics(): void {
    // No-op for DB backed
    console.warn('clearMetrics() called but using DB backing - no op');
}

