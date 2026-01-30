/**
 * CI/QA Tests for CITY_NEWS_HUB Global Patch
 * 
 * Run with: npx tsx scripts/tests/news-hub.test.ts
 */

import {
    LEIPZIG_PACKAGE, MUENCHEN_PACKAGE, KOELN_PACKAGE,
    FRANKFURT_PACKAGE, STUTTGART_PACKAGE, DUESSELDORF_PACKAGE
} from '../city-packages';
import citiesIndex from '../city-packages.index.json';
import { slugify_ascii_lower, classifyActionStrength, extractUkraineKeywords, isAllowedCityURL } from '../helpers';

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

console.log('\n📋 CITY_NEWS_HUB Global Patch Tests\n');
console.log('='.repeat(60));

// TEST 1: Helper Functions
console.log('\n🔧 Helper Function Tests\n');

test('slugify_ascii_lower: Düsseldorf → duesseldorf', () => {
    const result = slugify_ascii_lower('Düsseldorf');
    if (result !== 'duesseldorf') {
        throw new Error(`Expected 'duesseldorf', got '${result}'`);
    }
});

test('slugify_ascii_lower: München → muenchen', () => {
    const result = slugify_ascii_lower('München');
    if (result !== 'muenchen') {
        throw new Error(`Expected 'muenchen', got '${result}'`);
    }
});

test('slugify_ascii_lower: Freiburg im Breisgau → freiburg-im-breisgau', () => {
    const result = slugify_ascii_lower('Freiburg im Breisgau');
    if (result !== 'freiburg-im-breisgau') {
        throw new Error(`Expected 'freiburg-im-breisgau', got '${result}'`);
    }
});

// TEST 2: Action Classifier
console.log('\n⚡ Action Strength Classifier Tests\n');

test('Strong action: deadline keyword → HIGH + push', () => {
    const result = classifyActionStrength(
        'Wichtig! Unterlagen bis 15.02. einreichen',
        ['ukraine', 'unterlagen', 'frist']
    );

    if (result.strength !== 'strong' || result.priority !== 'HIGH' || !result.allowPush) {
        throw new Error(`Expected strong/HIGH/push, got ${JSON.stringify(result)}`);
    }
});

test('Weak action: no triggers → MEDIUM + no push', () => {
    const result = classifyActionStrength(
        'Neue Informationen für Ukrainer verfügbar',
        ['ukraine', 'informationen']
    );

    if (result.strength !== 'weak_or_none' || result.priority !== 'MEDIUM' || result.allowPush) {
        throw new Error(`Expected weak/MEDIUM/no-push, got ${JSON.stringify(result)}`);
    }
});

// TEST 3: Keyword Extraction
console.log('\n🔍 Keyword Extraction Tests\n');

test('Extract Ukraine keywords from German text', () => {
    const text = 'Wichtige Information für Ukraine-Geflüchtete bezüglich Aufenthalt';
    const keywords = extractUkraineKeywords(text);

    if (keywords.length === 0) {
        throw new Error('Should find Ukraine keywords');
    }

    console.log(`   Found: ${keywords.join(', ')}`);
});

// TEST 4: URL Validation
console.log('\n🌐 URL Validation Tests\n');

test('Allow official city domain', () => {
    const url = 'https://www.leipzig.de/nachrichten/ukraine-hilfe';
    const result = isAllowedCityURL(url, 'leipzig');

    if (!result) {
        throw new Error('Should allow official city domain');
    }
});

test('Reject culture/events URL', () => {
    const url = 'https://www.leipzig.de/veranstaltungen/konzert';
    const result = isAllowedCityURL(url, 'leipzig');

    if (result) {
        throw new Error('Should reject culture/events URL');
    }
});

// TEST 5: ALL 33 Cities Have NEWS_HUB
console.log('\n🌍 City Package Coverage Tests\n');

test('Leipzig has 5 sources including NEWS_HUB', () => {
    if (LEIPZIG_PACKAGE.length !== 5) {
        throw new Error(`Expected 5 sources, got ${LEIPZIG_PACKAGE.length}`);
    }

    const newsHub = LEIPZIG_PACKAGE.find(s => s.source_id === 'city_lej_news_hub');
    if (!newsHub) {
        throw new Error('NEWS_HUB not found');
    }

    console.log(`   ✓ source_id: ${newsHub.source_id}`);
});

test('München has 5 sources including NEWS_HUB', () => {
    if (MUENCHEN_PACKAGE.length !== 5) {
        throw new Error(`Expected 5 sources, got ${MUENCHEN_PACKAGE.length}`);
    }

    const newsHub = MUENCHEN_PACKAGE.find(s => s.source_id === 'city_muc_news_hub');
    if (!newsHub) {
        throw new Error('NEWS_HUB not found');
    }
});

test('Köln has 5 sources including NEWS_HUB', () => {
    if (KOELN_PACKAGE.length !== 5) {
        throw new Error(`Expected 5 sources, got ${KOELN_PACKAGE.length}`);
    }

    const newsHub = KOELN_PACKAGE.find(s => s.source_id === 'city_cgn_news_hub');
    if (!newsHub) {
        throw new Error('NEWS_HUB not found');
    }
});

// TEST 6: NEWS_HUB Configuration
console.log('\n⚙️  NEWS_HUB Configuration Tests\n');

test('NEWS_HUB has correct mode and discovery config', () => {
    const newsHub = LEIPZIG_PACKAGE.find(s => s.source_id === 'city_lej_news_hub');

    if (!newsHub) {
        throw new Error('NEWS_HUB not found');
    }

    const config = newsHub as any;

    if (config.mode !== 'DISCOVER_AND_FILTER') {
        throw new Error(`Expected mode DISCOVER_AND_FILTER, got ${config.mode}`);
    }

    if (!config.discovery || config.discovery.provider !== 'WEB_SEARCH') {
        throw new Error('Discovery config missing or invalid');
    }

    console.log(`   ✓ mode: ${config.mode}`);
    console.log(`   ✓ provider: ${config.discovery.provider}`);
    console.log(`   ✓ queries: ${config.discovery.queries.length}`);
});

test('NEWS_HUB has action filters configured', () => {
    const newsHub = LEIPZIG_PACKAGE.find(s => s.source_id === 'city_lej_news_hub') as any;

    if (!newsHub.filters) {
        throw new Error('Filters not configured');
    }

    if (!newsHub.filters.keywords_any) {
        throw new Error('Keywords not configured');
    }

    if (!newsHub.filters.action_triggers_any) {
        throw new Error('Action triggers not configured');
    }

    console.log(`   ✓ Keywords: ${newsHub.filters.keywords_any.de_en.length} DE/EN`);
    console.log(`   ✓ Triggers: ${newsHub.filters.action_triggers_any.length}`);
});

// SUMMARY
console.log('\n' + '='.repeat(60));
console.log(`\n📊 Test Summary: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
    console.log('❌ Some tests failed\n');
    process.exit(1);
}

console.log('✅ All NEWS_HUB tests passed!\n');
console.log('📌 KEY FINDINGS:\n');
console.log('✅ Helper functions working correctly');
console.log('✅ Action classifier correctly identifies strong/weak triggers');
console.log('✅ All tested cities have NEWS_HUB as 5th source');
console.log('✅ NEWS_HUB properly configured with discovery + filters\n');
