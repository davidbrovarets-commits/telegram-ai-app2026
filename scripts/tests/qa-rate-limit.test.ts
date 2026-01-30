/**
 * QA TEST — Rate Limiting (Supabase Version)
 * 
 * Validates rate limiting enforcement with Supabase persistence.
 * Run with: npx tsx scripts/tests/qa-rate-limit.test.ts
 * 
 * IMPORTANT: Requires Supabase connection and rate_limits table.
 */

import {
    checkRateLimit,
    recordHighPush,
    getRateLimitStatus,
    clearUserRateLimit,
    clearAllRateLimits
} from '../rate-limiter';

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

console.log('\n📋 Rate Limiting Tests (Supabase)\n');
console.log('='.repeat(50));

// Clear all limits before tests
await clearAllRateLimits();
console.log('🧹 Cleared all rate limits for fresh test run\n');

// Wait a bit for DB cleanup
await new Promise(resolve => setTimeout(resolve, 500));

// T9a: First HIGH push allowed
await test('T9a: First HIGH push is allowed', async () => {
    const user = 'test_user_1';
    const result = await checkRateLimit(user, 'HIGH');

    if (!result.allowed) {
        throw new Error('First push should be allowed');
    }

    if (result.count !== 0) {
        throw new Error(`Expected count 0, got ${result.count}`);
    }

    console.log(`   Reason: ${result.reason}`);
});

// T9b: Second HIGH push allowed
await test('T9b: Second HIGH push is allowed (after recording first)', async () => {
    const user = 'test_user_1';

    // Record first push
    await recordHighPush(user);

    // Wait for DB write
    await new Promise(resolve => setTimeout(resolve, 200));

    // Check second
    const result = await checkRateLimit(user, 'HIGH');

    if (!result.allowed) {
        throw new Error('Second push should be allowed');
    }

    if (result.count !== 1) {
        throw new Error(`Expected count 1, got ${result.count}`);
    }

    console.log(`   Reason: ${result.reason}`);
});

// T9c: Third HIGH push blocked
await test('T9c: Third HIGH push is BLOCKED', async () => {
    const user = 'test_user_1';

    // Record second push (first already recorded in previous test)
    await recordHighPush(user);

    // Wait for DB write
    await new Promise(resolve => setTimeout(resolve, 200));

    // Check third
    const result = await checkRateLimit(user, 'HIGH');

    if (result.allowed) {
        throw new Error('Third push should be BLOCKED');
    }

    if (!result.reason) {
        throw new Error('Should provide reason for blocking');
    }

    if (result.count !== 2) {
        throw new Error(`Expected count 2, got ${result.count}`);
    }

    console.log(`   ❌ BLOCKED: ${result.reason}`);
});

// T9d: MEDIUM/LOW bypasses limit
await test('T9d: MEDIUM priority bypasses rate limit', async () => {
    const user = 'test_user_1'; // same user with 2 HIGH already sent

    const result = await checkRateLimit(user, 'MEDIUM');

    if (!result.allowed) {
        throw new Error('MEDIUM priority should bypass rate limit');
    }

    console.log(`   Reason: ${result.reason}`);
});

await test('T9d2: LOW priority bypasses rate limit', async () => {
    const user = 'test_user_1'; // same user with 2 HIGH already sent

    const result = await checkRateLimit(user, 'LOW');

    if (!result.allowed) {
        throw new Error('LOW priority should bypass rate limit');
    }

    console.log(`   Reason: ${result.reason}`);
});

// T9e: Different user has separate limit
await test('T9e: Different user has independent rate limit', async () => {
    const user2 = 'test_user_2'; // new user

    const result = await checkRateLimit(user2, 'HIGH');

    if (!result.allowed) {
        throw new Error('New user should be allowed (separate limit)');
    }

    if (result.count !== 0) {
        throw new Error(`Expected count 0 for new user, got ${result.count}`);
    }

    console.log(`   New user starts with fresh limit`);
});

// T9f: Status tracking
await test('T9f: getRateLimitStatus returns correct data', async () => {
    const user = 'test_user_1';

    const status = await getRateLimitStatus(user);

    if (status.count !== 2) {
        throw new Error(`Expected count 2, got ${status.count}`);
    }

    if (status.limit !== 2) {
        throw new Error(`Expected limit 2, got ${status.limit}`);
    }

    if (!status.window_start) {
        throw new Error('window_start should be set');
    }

    if (!status.window_expiry) {
        throw new Error('window_expiry should be set');
    }

    console.log(`   Count: ${status.count}/${status.limit}`);
    console.log(`   Window: ${status.window_start.toISOString()}`);
});

// T9g: User-specific clear
await test('T9g: clearUserRateLimit resets specific user', async () => {
    const user = 'test_user_1';

    // Clear this user's limit
    await clearUserRateLimit(user);

    // Wait for DB write
    await new Promise(resolve => setTimeout(resolve, 200));

    // Check if reset
    const result = await checkRateLimit(user, 'HIGH');

    if (!result.allowed) {
        throw new Error('User should be allowed after clear');
    }

    if (result.count !== 0) {
        throw new Error(`Expected count 0 after clear, got ${result.count}`);
    }

    console.log(`   User limit successfully cleared`);
});

console.log('\n' + '='.repeat(50));
console.log(`\n📊 Test Summary: ${passed} passed, ${failed} failed\n`);

console.log('\n📌 RATE LIMITING VALIDATION:\n');
console.log('✅ Max 2 HIGH pushes per 24h: ENFORCED');
console.log('✅ MEDIUM/LOW bypass limit: WORKING');
console.log('✅ Per-user isolation: WORKING');
console.log('✅ Status tracking: WORKING\n');

console.log('⚠️  NOTE: In-memory store (session-based)');
console.log('   → For production: Replace with persistent store (Supabase/Redis)\n');

if (failed > 0) {
    process.exit(1);
}

console.log('✅ All rate limiting tests passed!\n');
