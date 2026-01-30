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

// =============================================
// IN-MEMORY METRICS STORE (replace with DB)
// =============================================

const metricsStore: PushMetricsDaily[] = [];

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
export function runDailyAggregation(date: Date): PushMetricsDaily[] {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const metrics = aggregateEvents(startOfDay, endOfDay);

    // Store metrics
    for (const metric of metrics) {
        // Remove existing metrics for the same key
        const existingIndex = metricsStore.findIndex(m =>
            m.date === metric.date &&
            m.scope === metric.scope &&
            m.priority === metric.priority &&
            m.land === metric.land &&
            m.city === metric.city &&
            m.source_id === metric.source_id &&
            m.template_id === metric.template_id
        );

        if (existingIndex >= 0) {
            metricsStore[existingIndex] = metric;
        } else {
            metricsStore.push(metric);
        }
    }

    console.log(`[Aggregation] Processed ${metrics.length} metric groups for ${date.toISOString().split('T')[0]}`);

    return metrics;
}

/**
 * Runs aggregation for all days in a range
 */
export function runAggregationForRange(startDate: Date, endDate: Date): PushMetricsDaily[] {
    const allMetrics: PushMetricsDaily[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        const dayMetrics = runDailyAggregation(new Date(currentDate));
        allMetrics.push(...dayMetrics);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return allMetrics;
}

// =============================================
// METRICS ACCESS
// =============================================

export function getMetrics(): PushMetricsDaily[] {
    return [...metricsStore];
}

export function getMetricsByFilter(filter: {
    startDate?: string;
    endDate?: string;
    scope?: Scope;
    land?: string;
    city?: string;
    priority?: Priority;
    source_id?: string;
    template_id?: TemplateId;
}): PushMetricsDaily[] {
    return metricsStore.filter(m => {
        if (filter.startDate && m.date < filter.startDate) return false;
        if (filter.endDate && m.date > filter.endDate) return false;
        if (filter.scope && m.scope !== filter.scope) return false;
        if (filter.land && m.land !== filter.land) return false;
        if (filter.city && m.city !== filter.city) return false;
        if (filter.priority && m.priority !== filter.priority) return false;
        if (filter.source_id && m.source_id !== filter.source_id) return false;
        if (filter.template_id && m.template_id !== filter.template_id) return false;
        return true;
    });
}

export function clearMetrics(): void {
    metricsStore.length = 0;
}
