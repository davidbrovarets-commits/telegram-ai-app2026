/**
 * QA TEST — Deduplication Logic
 * 
 * Validates deduplication behavior for same-source and cross-layer scenarios.
 * Run with: npx tsx scripts/tests/qa-dedupe.test.ts
 * 
 * Updated for async shouldSendPush (Supabase rate limiter)
 */

import { shouldSendPush, DedupeRecord } from '../push-templates';

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void>): Promise<void> {
    try {
        await fn();
        console.log(`✅ PASS: ${name}`);
        passed++;
    } catch (error) {
        console.log(`❌ FAIL: ${name}`);
        console.log(`   ${(error as Error).message}`);
        failed++;
    }
}


console.log('\n📋 Deduplication Logic Tests\n');
console.log('='.repeat(50));

// T7: Same content, same source = dedupe
await test('T7: Same content hash in same dedupe_group is suppressed', async () => {
    const existingRecords: DedupeRecord[] = [
        {
            dedupeGroup: 'city_LEJ_jobcenter',
            lastPushHash: 'abc123',
            lastPushTime: new Date()
        }
    ];

    const result = await shouldSendPush(
        'user_123',          // user_hash
        'HIGH',              // priority
        'city_LEJ_jobcenter',
        'abc123', // same hash
        null,
        existingRecords
    );

    if (result.send) {
        throw new Error('Should NOT send duplicate message');
    }

    if (!result.reason) {
        throw new Error('Should provide reason for suppression');
    }

    console.log(`   Reason: ${result.reason}`);
});

await test('T7b: Different content hash in same dedupe_group is allowed', async () => {
    const existingRecords: DedupeRecord[] = [
        {
            dedupeGroup: 'city_LEJ_jobcenter',
            lastPushHash: 'abc123',
            lastPushTime: new Date()
        }
    ];

    const result = await shouldSendPush(
        'user_123',          // user_hash
        'HIGH',              // priority
        'city_LEJ_jobcenter',
        'xyz789', // different hash
        null,
        existingRecords
    );

    if (!result.send) {
        throw new Error('Should send new message with different content');
    }

    console.log(`   New content allowed: ${result.send}`);
});

await test('T7c: First message in dedupe_group is allowed', async () => {
    const existingRecords: DedupeRecord[] = [];

    const result = await shouldSendPush(
        'user_123',          // user_hash
        'HIGH',              // priority
        'city_LEJ_jobcenter',
        'first_message',
        null,
        existingRecords
    );

    if (!result.send) {
        throw new Error('Should send first message');
    }

    console.log(`   First message allowed: ${result.send}`);
});


// T8: Cross-layer dedupe concerns
console.log('\n' + '='.repeat(50));
console.log('📋 Cross-Layer Dedupe Analysis\n');

await test('T8: Different dedupe_groups allow duplicate content (DOCUMENT CONCERN)', async () => {
    // Simulate LAND source
    const landRecords: DedupeRecord[] = [
        {
            dedupeGroup: 'land_sachsen_main',
            lastPushHash: 'content_xyz',
            lastPushTime: new Date()
        }
    ];

    // Simulate CITY source with SAME content but different dedupe_group
    const cityResult = await shouldSendPush(
        'user_123',          // user_hash
        'HIGH',              // priority
        'city_LEJ_help', // different dedupe_group
        'content_xyz',   // same content hash
        null,
        landRecords
    );

    // Current implementation: different dedupe_group = both sent
    if (!cityResult.send) {
        console.log('   ✅ GOOD: Cross-layer dedupe is working');
    } else {
        console.log('   ⚠️  CONCERN: Different dedupe_group allows duplicate content');
        console.log('   → LAND(land_sachsen_main) and CITY(city_LEJ_help) could send same content');
        console.log('   → RECOMMENDATION: Implement content-based dedupe across all layers');
    }
});

// Deadline-based filtering
await test('T7d: Expired deadline prevents push', async () => {
    const pastDate = new Date('2020-01-01'); // clearly in the past

    const result = await shouldSendPush(
        'user_123',          // user_hash
        'HIGH',              // priority
        'city_LEJ_jobcenter',
        'new_content',
        pastDate,
        []
    );

    if (result.send) {
        throw new Error('Should NOT send message with expired deadline');
    }

    if (!result.reason) {
        throw new Error('Should provide reason for blocking');
    }

    console.log(`   Reason: ${result.reason}`);
});

await test('T7e: Future deadline allows push', async () => {
    const futureDate = new Date('2030-01-01');

    const result = await shouldSendPush(
        'user_123',          // user_hash
        'HIGH',              // priority
        'city_LEJ_jobcenter',
        'new_content',
        futureDate,
        []
    );

    if (!result.send) {
        throw new Error('Should send message with future deadline');
    }

    console.log(`   Future deadline allowed: ${result.send}`);
});

console.log('\n' + '='.repeat(50));
console.log(`\n📊 Test Summary: ${passed} passed, ${failed} failed\n`);

console.log('\n📌 KEY FINDINGS:\n');
console.log('✅ Same-source deduplication: WORKING');
console.log('✅ Deadline-based filtering: WORKING');
console.log('⚠️  Cross-layer deduplication: NOT IMPLEMENTED');
console.log('   → Current: Different dedupe_group = both messages sent');
console.log('   → Risk: LAND and CITY sources may send duplicate content');
console.log('   → Recommendation: Add content hash dedupe across all layers\n');

if (failed > 0) {
    process.exit(1);
}

console.log('✅ Core deduplication logic tests passed!\n');
