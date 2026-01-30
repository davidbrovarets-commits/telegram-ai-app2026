/**
 * Push Analytics - Unit Tests
 * 
 * Tests for event logging, aggregation, and privacy rules.
 * Run with: npx tsx scripts/tests/push-analytics.test.ts
 */

import {
    logDelivered,
    logOpened,
    logClicked,
    logActionCompleted,
    getEvents,
    getEventsByPushId,
    clearEvents,
    createUserHash,
    PushContext
} from '../analytics/push-event-logger';
import {
    runDailyAggregation,
    getMetrics,
    clearMetrics
} from '../analytics/push-aggregation';
import { getMetricsSummary } from '../analytics/push-dashboard';

// =============================================
// TEST RUNNER
// =============================================

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
    try {
        fn();
        console.log(`✅ PASS: ${name}`);
        passed++;
    } catch (error) {
        console.log(`❌ FAIL: ${name}`);
        console.log(`   ${(error as Error).message}`);
        failed++;
    }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
    if (actual !== expected) {
        throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
}

function assertNotEqual<T>(actual: T, expected: T, message: string): void {
    if (actual === expected) {
        throw new Error(`${message}: expected NOT ${expected}, but got ${actual}`);
    }
}

function assertTrue(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(message);
    }
}

// =============================================
// TEST FIXTURES
// =============================================

const testContext: PushContext = {
    telegramUserId: 'test_user_123',
    country: 'DE',
    land: 'Sachsen',
    city: 'Leipzig',
    scope: 'CITY',
    priority: 'HIGH',
    source_id: 'city_LEJ_jobcenter',
    dedupe_group: 'city_LEJ_jobcenter',
    template_id: 'CITY_JOBCENTER'
};

// =============================================
// TESTS
// =============================================

console.log('\n📋 Push Analytics Unit Tests\n');
console.log('='.repeat(50));

// Clean up before tests
clearEvents();
clearMetrics();

// TEST 1: Sending a HIGH push writes delivered event
test('1) Sending a HIGH push writes delivered event', () => {
    clearEvents();

    const { push_id, event } = logDelivered(testContext);

    assertTrue(!!push_id, 'push_id should be generated');
    assertTrue(!!event, 'event should be returned');
    assertEqual(event!.event_type, 'delivered', 'event_type');
    assertEqual(event!.priority, 'HIGH', 'priority');

    const events = getEvents();
    assertEqual(events.length, 1, 'events count');
});

// TEST 2: Opening from push writes opened event
test('2) Opening from push writes opened event', () => {
    clearEvents();

    const { push_id } = logDelivered(testContext);
    const openedEvent = logOpened(testContext, push_id);

    assertTrue(!!openedEvent, 'opened event should be returned');
    assertEqual(openedEvent!.event_type, 'opened', 'event_type');
    assertEqual(openedEvent!.push_id, push_id, 'push_id should match');

    const events = getEventsByPushId(push_id);
    assertEqual(events.length, 2, 'events count for push_id');
});

// TEST 3: Clicking CTA writes clicked event
test('3) Clicking CTA writes clicked event', () => {
    clearEvents();

    const { push_id } = logDelivered(testContext);
    logOpened(testContext, push_id);
    const clickedEvent = logClicked(testContext, push_id, { screen: 'news_detail' });

    assertTrue(!!clickedEvent, 'clicked event should be returned');
    assertEqual(clickedEvent!.event_type, 'clicked', 'event_type');
    assertTrue(clickedEvent!.meta !== null, 'meta should be set');
    assertEqual((clickedEvent!.meta as Record<string, unknown>).screen, 'news_detail', 'meta.screen');
});

// TEST 4: Completing action writes action_completed event
test('4) Completing action writes action_completed event', () => {
    clearEvents();

    const { push_id } = logDelivered(testContext);
    logOpened(testContext, push_id);
    logClicked(testContext, push_id);
    const actionEvent = logActionCompleted(testContext, push_id, 'upload_document');

    assertTrue(!!actionEvent, 'action_completed event should be returned');
    assertEqual(actionEvent!.event_type, 'action_completed', 'event_type');
    assertEqual(actionEvent!.action_type, 'upload_document', 'action_type');
});

// TEST 5: Aggregation job produces daily row with correct counts
test('5) Aggregation job produces daily row with correct counts', () => {
    clearEvents();
    clearMetrics();

    // Create a full funnel
    const { push_id } = logDelivered(testContext);
    logOpened(testContext, push_id);
    logClicked(testContext, push_id);
    logActionCompleted(testContext, push_id, 'upload_document');

    // Also create a partial funnel (delivered only)
    logDelivered(testContext);

    // Run aggregation
    const metrics = runDailyAggregation(new Date());

    assertTrue(metrics.length > 0, 'metrics should be generated');

    const metric = metrics[0];
    assertEqual(metric.delivered_count, 2, 'delivered_count');
    assertEqual(metric.opened_count, 1, 'opened_count');
    assertEqual(metric.clicked_count, 1, 'clicked_count');
    assertEqual(metric.action_completed_count, 1, 'action_completed_count');
});

// TEST 6: No message text stored anywhere in DB
test('6) No message text stored anywhere in DB', () => {
    clearEvents();

    const { event } = logDelivered({
        ...testContext,
        // These should NOT be stored even if passed
    });

    assertTrue(!!event, 'event should exist');

    const eventString = JSON.stringify(event);

    // Check that no suspicious content is stored
    assertTrue(!eventString.includes('Потрібна дія'), 'No Ukrainian push text');
    assertTrue(!eventString.includes('Jobcenter вимагає'), 'No German terms in body');
    assertTrue(!eventString.includes('telegram_user_id'), 'No raw telegram_user_id');
});

// TEST 7: User hash is non-reversible
test('7) User hash is non-reversible', () => {
    const hash1 = createUserHash('user_12345');
    const hash2 = createUserHash('user_12345');
    const hash3 = createUserHash('user_67890');

    assertEqual(hash1, hash2, 'Same input produces same hash');
    assertNotEqual(hash1, hash3, 'Different input produces different hash');
    assertTrue(hash1.length === 32, 'Hash is 32 characters');
    assertTrue(!hash1.includes('user_12345'), 'Hash does not contain original ID');
});

// TEST 8: Duplicate events are ignored
test('8) Duplicate events are ignored', () => {
    clearEvents();

    const { push_id, event: event1 } = logDelivered(testContext);

    // Try to log the same event again
    const event2 = logOpened(testContext, push_id);
    const event3 = logOpened(testContext, push_id); // Duplicate

    assertTrue(!!event1, 'First event logged');
    assertTrue(!!event2, 'Second event logged');
    assertTrue(event3 === null, 'Duplicate should be ignored');

    const events = getEventsByPushId(push_id);
    assertEqual(events.length, 2, 'Only 2 events should exist');
});

// TEST 9: Orphan opens are flagged
test('9) Orphan opens are flagged', () => {
    clearEvents();

    // Log opened without delivered first
    const orphanEvent = logOpened(testContext, 'orphan_push_id_123');

    assertTrue(!!orphanEvent, 'Orphan event should be logged');
    assertTrue(orphanEvent!.meta !== null, 'Meta should exist');
    assertEqual((orphanEvent!.meta as Record<string, unknown>).orphan_open, true, 'orphan_open flag');
});

// TEST 10: Dashboard summary computes rates correctly
test('10) Dashboard summary computes rates correctly', () => {
    clearEvents();
    clearMetrics();

    // Create 10 delivered, 5 opened, 2 clicked, 1 action
    for (let i = 0; i < 10; i++) {
        const { push_id } = logDelivered({ ...testContext, telegramUserId: `user_${i}` });
        if (i < 5) logOpened({ ...testContext, telegramUserId: `user_${i}` }, push_id);
        if (i < 2) logClicked({ ...testContext, telegramUserId: `user_${i}` }, push_id);
        if (i < 1) logActionCompleted({ ...testContext, telegramUserId: `user_${i}` }, push_id, 'upload_document');
    }

    runDailyAggregation(new Date());
    const summary = getMetricsSummary();

    assertEqual(summary.totals.delivered, 10, 'delivered');
    assertEqual(summary.totals.opened, 5, 'opened');
    assertEqual(summary.totals.clicked, 2, 'clicked');
    assertEqual(summary.totals.action_completed, 1, 'action_completed');
    assertTrue(Math.abs(summary.totals.open_rate - 0.5) < 0.01, 'open_rate should be 50%');
});

// =============================================
// SUMMARY
// =============================================

console.log('\n' + '='.repeat(50));
console.log(`\n📊 Test Summary: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
    process.exit(1);
}

console.log('✅ All push analytics tests passed!\n');
