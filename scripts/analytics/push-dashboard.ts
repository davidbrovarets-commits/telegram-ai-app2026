/**
 * Push Analytics - Dashboard & Export
 * 
 * Provides metrics summary and CSV export functionality.
 * Supports filters by date range, scope, land, city, priority.
 */

import {
    MetricsFilter,
    MetricsSummary,
    PushMetricsDaily
} from './push-event-schema';
import { getMetricsByFilter } from './push-aggregation';

// =============================================
// DASHBOARD: METRICS SUMMARY
// =============================================

/**
 * Generates a summary of push metrics for the dashboard
 */
export async function getMetricsSummary(filter: MetricsFilter = {}): Promise<MetricsSummary> {
    // Default to last 30 days if no date range specified
    const endDate = filter.endDate || new Date().toISOString().split('T')[0];
    const startDate = filter.startDate || (() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    })();

    const metrics = await getMetricsByFilter({
        ...filter,
        startDate,
        endDate
    });

    // Calculate totals
    let totalDelivered = 0;
    let totalOpened = 0;
    let totalClicked = 0;
    let totalActionCompleted = 0;

    for (const m of metrics) {
        totalDelivered += m.delivered_count;
        totalOpened += m.opened_count;
        totalClicked += m.clicked_count;
        totalActionCompleted += m.action_completed_count;
    }

    // Group by source
    const bySourceMap = new Map<string, { delivered: number; opened: number; action_completed: number }>();
    for (const m of metrics) {
        const existing = bySourceMap.get(m.source_id) || { delivered: 0, opened: 0, action_completed: 0 };
        existing.delivered += m.delivered_count;
        existing.opened += m.opened_count;
        existing.action_completed += m.action_completed_count;
        bySourceMap.set(m.source_id, existing);
    }

    const bySource = Array.from(bySourceMap.entries())
        .map(([source_id, data]) => ({
            source_id,
            delivered: data.delivered,
            opened: data.opened,
            open_rate: data.delivered > 0 ? data.opened / data.delivered : 0,
            action_rate: data.delivered > 0 ? data.action_completed / data.delivered : 0
        }))
        .sort((a, b) => b.delivered - a.delivered)
        .slice(0, 10);

    // Group by city
    const byCityMap = new Map<string, { delivered: number; opened: number }>();
    for (const m of metrics) {
        if (m.city) {
            const existing = byCityMap.get(m.city) || { delivered: 0, opened: 0 };
            existing.delivered += m.delivered_count;
            existing.opened += m.opened_count;
            byCityMap.set(m.city, existing);
        }
    }

    const byCity = Array.from(byCityMap.entries())
        .map(([city, data]) => ({
            city,
            delivered: data.delivered,
            opened: data.opened,
            open_rate: data.delivered > 0 ? data.opened / data.delivered : 0
        }))
        .sort((a, b) => b.delivered - a.delivered)
        .slice(0, 10);

    // Group by land
    const byLandMap = new Map<string, { delivered: number; opened: number }>();
    for (const m of metrics) {
        if (m.land) {
            const existing = byLandMap.get(m.land) || { delivered: 0, opened: 0 };
            existing.delivered += m.delivered_count;
            existing.opened += m.opened_count;
            byLandMap.set(m.land, existing);
        }
    }

    const byLand = Array.from(byLandMap.entries())
        .map(([land, data]) => ({
            land,
            delivered: data.delivered,
            opened: data.opened,
            open_rate: data.delivered > 0 ? data.opened / data.delivered : 0
        }))
        .sort((a, b) => b.delivered - a.delivered);

    return {
        filters: filter,
        period: { start: startDate, end: endDate },
        totals: {
            delivered: totalDelivered,
            opened: totalOpened,
            clicked: totalClicked,
            action_completed: totalActionCompleted,
            open_rate: totalDelivered > 0 ? totalOpened / totalDelivered : 0,
            click_rate: totalDelivered > 0 ? totalClicked / totalDelivered : 0,
            action_rate: totalDelivered > 0 ? totalActionCompleted / totalDelivered : 0
        },
        by_source: bySource,
        by_city: byCity,
        by_land: byLand
    };
}

// =============================================
// CSV EXPORT
// =============================================

/**
 * Exports metrics as CSV string
 */
/**
 * Exports metrics as CSV string
 */
export async function exportMetricsCSV(filter: MetricsFilter = {}): Promise<string> {
    const metrics = await getMetricsByFilter(filter);

    const headers = [
        'date',
        'scope',
        'priority',
        'land',
        'city',
        'source_id',
        'template_id',
        'delivered_count',
        'opened_count',
        'clicked_count',
        'action_completed_count',
        'open_rate',
        'click_rate',
        'action_rate',
        'click_to_action_rate'
    ];

    const rows = metrics.map(m => [
        m.date,
        m.scope,
        m.priority,
        m.land || '',
        m.city || '',
        m.source_id,
        m.template_id,
        m.delivered_count.toString(),
        m.opened_count.toString(),
        m.clicked_count.toString(),
        m.action_completed_count.toString(),
        (m.open_rate || 0).toFixed(4),
        (m.click_rate || 0).toFixed(4),
        (m.action_rate || 0).toFixed(4),
        (m.click_to_action_rate || 0).toFixed(4)
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

// =============================================
// JSON EXPORT (for API endpoint)
// =============================================

/**
 * Returns metrics as JSON for API consumption
 */
export async function getMetricsJSON(filter: MetricsFilter = {}): Promise<{
    summary: MetricsSummary;
    raw_metrics: PushMetricsDaily[];
}> {
    return {
        summary: await getMetricsSummary(filter),
        raw_metrics: await getMetricsByFilter(filter)
    };
}

// =============================================
// TOP PERFORMERS
// =============================================

/**
 * Gets top sources by a specific metric
 */
export async function getTopSourcesByMetric(
    metric: 'delivered' | 'open_rate' | 'action_rate',
    limit: number = 10,
    filter: MetricsFilter = {}
): Promise<Array<{ source_id: string; value: number }>> {
    const summary = await getMetricsSummary(filter);

    let sortedSources: Array<{ source_id: string; value: number }>;

    switch (metric) {
        case 'delivered':
            sortedSources = summary.by_source.map(s => ({ source_id: s.source_id, value: s.delivered }));
            break;
        case 'open_rate':
            sortedSources = summary.by_source.map(s => ({ source_id: s.source_id, value: s.open_rate }));
            break;
        case 'action_rate':
            sortedSources = summary.by_source.map(s => ({ source_id: s.source_id, value: s.action_rate }));
            break;
    }

    return sortedSources.sort((a, b) => b.value - a.value).slice(0, limit);
}

// =============================================
// CONSOLE DASHBOARD (for development)
// =============================================

/**
 * Prints a formatted dashboard to console
 */
/**
 * Prints a formatted dashboard to console
 */
export async function printDashboard(filter: MetricsFilter = {}): Promise<void> {
    const summary = await getMetricsSummary(filter);

    console.log('\n' + '='.repeat(60));
    console.log('📊 PUSH ANALYTICS DASHBOARD');
    console.log('='.repeat(60));
    console.log(`Period: ${summary.period.start} to ${summary.period.end}`);
    console.log('');

    console.log('📈 TOTALS');
    console.log('-'.repeat(40));
    console.log(`Delivered:        ${summary.totals.delivered}`);
    console.log(`Opened:           ${summary.totals.opened} (${(summary.totals.open_rate * 100).toFixed(1)}%)`);
    console.log(`Clicked:          ${summary.totals.clicked} (${(summary.totals.click_rate * 100).toFixed(1)}%)`);
    console.log(`Action Completed: ${summary.totals.action_completed} (${(summary.totals.action_rate * 100).toFixed(1)}%)`);
    console.log('');

    console.log('🏆 TOP 10 SOURCES BY DELIVERED');
    console.log('-'.repeat(40));
    for (const s of summary.by_source) {
        console.log(`  ${s.source_id}: ${s.delivered} (open: ${(s.open_rate * 100).toFixed(1)}%)`);
    }
    console.log('');

    console.log('🏙️ TOP 10 CITIES');
    console.log('-'.repeat(40));
    for (const c of summary.by_city) {
        console.log(`  ${c.city}: ${c.delivered} (open: ${(c.open_rate * 100).toFixed(1)}%)`);
    }
    console.log('');

    console.log('🗺️ BY BUNDESLAND');
    console.log('-'.repeat(40));
    for (const l of summary.by_land) {
        console.log(`  ${l.land}: ${l.delivered} (open: ${(l.open_rate * 100).toFixed(1)}%)`);
    }
    console.log('');
    console.log('='.repeat(60) + '\n');
}
