/**
 * Test for Link Health Check
 * 
 * Run with: npx tsx scripts/tests/link-health.test.ts
 */

import { validateUrlHealth } from '../helpers';

async function test(name: string, fn: () => Promise<void>) {
    try {
        process.stdout.write(`Testing ${name}... `);
        await fn();
        console.log('✅ PASS');
    } catch (error) {
        console.log('❌ FAIL');
        console.error(error);
        process.exit(1);
    }
}

async function runTests() {
    console.log('\n🔗 Link Health Check Tests\n');

    await test('Valid URL (Google) returns true', async () => {
        const result = await validateUrlHealth('https://www.google.com');
        if (!result) throw new Error('Google should be reachable');
    });

    await test('Valid URL (Stadt Köln) returns true', async () => {
        const result = await validateUrlHealth('https://www.stadt-koeln.de');
        if (!result) throw new Error('Stadt Köln should be reachable');
    });

    await test('Dead URL (404) returns false', async () => {
        // Using a non-existent path on a valid domain
        const result = await validateUrlHealth('https://www.google.com/this-page-does-not-exist-12345');
        if (result) throw new Error('Non-existent page should return false');
    });

    await test('Invalid Domain returns false', async () => {
        const result = await validateUrlHealth('https://this-domain-definitely-does-not-exist-xyz.com');
        if (result) throw new Error('Invalid domain should return false');
    });

    console.log('\n✨ All link health tests passed!\n');
}

runTests();
