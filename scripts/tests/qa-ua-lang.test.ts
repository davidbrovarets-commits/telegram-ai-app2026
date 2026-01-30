/**
 * QA TEST — UA Language Compliance
 * 
 * Validates that all push notification templates generate Ukrainian content.
 * Run with: npx tsx scripts/tests/qa-ua-lang.test.ts
 */

import {
    jobcenterTemplate,
    immigrationTemplate,
    appointmentsTemplate,
    generalCityTemplate
} from '../push-templates';

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

console.log('\n📋 UA Language Compliance Tests\n');
console.log('='.repeat(50));

// Test 11: All templates return UA language
test('T11a: Jobcenter template returns UA content', () => {
    const result = jobcenterTemplate({
        city: 'Leipzig',
        actionShort: 'Подати документи',
        deadline: '15.02.2026'
    });

    if (result.language !== 'ua') {
        throw new Error(`Expected language 'ua', got '${result.language}'`);
    }

    // Check for Ukrainian (Cyrillic) characters
    const hasCyrillic = /[А-Яа-яІіЇїЄєҐґ]/.test(result.title);
    if (!hasCyrillic) {
        throw new Error(`Title does not contain Ukrainian text: ${result.title}`);
    }

    if (result.priority !== 'HIGH') {
        throw new Error(`Expected priority 'HIGH', got '${result.priority}'`);
    }

    console.log(`   Title: ${result.title}`);
    console.log(`   Body: ${result.body}`);
});

test('T11b: Immigration template returns UA content', () => {
    const result = immigrationTemplate({
        city: 'München',
        actionShort: 'Термінова дія'
    });

    if (result.language !== 'ua') {
        throw new Error(`Expected language 'ua', got '${result.language}'`);
    }

    const hasCyrillic = /[А-Яа-яІіЇїЄєҐґ]/.test(result.title);
    if (!hasCyrillic) {
        throw new Error(`Title does not contain Ukrainian text: ${result.title}`);
    }

    console.log(`   Title: ${result.title}`);
    console.log(`   Body: ${result.body}`);
});

test('T11c: Appointments template returns UA content', () => {
    const result = appointmentsTemplate({
        city: 'Köln',
        actionShort: 'Записатись онлайн'
    });

    if (result.language !== 'ua') {
        throw new Error(`Expected language 'ua', got '${result.language}'`);
    }

    const hasCyrillic = /[А-Яа-яІіЇїЄєҐґ]/.test(result.title);
    if (!hasCyrillic) {
        throw new Error(`Title does not contain Ukrainian text: ${result.title}`);
    }

    console.log(`   Title: ${result.title}`);
    console.log(`   Body: ${result.body}`);
});

test('T11d: General city template returns UA content', () => {
    const result = generalCityTemplate({
        city: 'Dresden',
        actionShort: 'Нова інформація'
    });

    if (result.language !== 'ua') {
        throw new Error(`Expected language 'ua', got '${result.language}'`);
    }

    const hasCyrillic = /[А-Яа-яІіЇїЄєҐґ]/.test(result.title);
    if (!hasCyrillic) {
        throw new Error(`Title does not contain Ukrainian text: ${result.title}`);
    }

    console.log(`   Title: ${result.title}`);
    console.log(`   Body: ${result.body}`);
});

// Test character limits
test('T11e: Templates respect character limits', () => {
    const result = jobcenterTemplate({
        city: 'Leipzig',
        actionShort: 'Very long action text that should be truncated to fit within the body character limit of 140 characters maximum for push notifications',
        deadline: '15.02.2026'
    });

    if (result.title.length > 60) {
        throw new Error(`Title exceeds 60 chars: ${result.title.length}`);
    }

    if (result.body.length > 140) {
        throw new Error(`Body exceeds 140 chars: ${result.body.length}`);
    }

    console.log(`   Title length: ${result.title.length}/60`);
    console.log(`   Body length: ${result.body.length}/140`);
});

// Test legal terms are explained
test('T11f: German legal terms include UA context', () => {
    const jobcenter = jobcenterTemplate({ city: 'Leipzig' });
    const immigration = immigrationTemplate({ city: 'München' });

    // These templates should contain German legal terms but with UA context
    const hasJobcenterMention = jobcenter.body.includes('Jobcenter');
    const hasAuslaenderMention = immigration.body.includes('Ausländerbehörde');

    if (!hasJobcenterMention) {
        throw new Error('Jobcenter template should mention "Jobcenter"');
    }

    if (!hasAuslaenderMention) {
        throw new Error('Immigration template should mention "Ausländerbehörde"');
    }

    console.log(`   Jobcenter: ${hasJobcenterMention ? 'mentioned' : 'missing'}`);
    console.log(`   Ausländerbehörde: ${hasAuslaenderMention ? 'mentioned' : 'missing'}`);
});

console.log('\n' + '='.repeat(50));
console.log(`\n📊 Test Summary: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
    process.exit(1);
}

console.log('✅ All UA language compliance tests passed!\n');
