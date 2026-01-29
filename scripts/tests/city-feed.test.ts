/**
 * CITY-Level Feed Autotests
 * 
 * Validates CITY-level feed routing for geo-scoped news system.
 * Run with: npx tsx scripts/tests/city-feed.test.ts
 */

import { resolveFeedSources, UserGeo, hasCityPackage } from '../feed-resolver';
import { SourceConfig } from '../config';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// =============================================
// TEST FIXTURES (USERS)
// =============================================

const user_leipzig: UserGeo = { country: 'DE', land: 'Sachsen', city: 'Leipzig' };
const user_munich: UserGeo = { country: 'DE', land: 'Bayern', city: 'München' };
const user_cologne: UserGeo = { country: 'DE', land: 'Nordrhein-Westfalen', city: 'Köln' };
const user_dresden: UserGeo = { country: 'DE', land: 'Sachsen', city: 'Dresden' };
const user_berlin: UserGeo = { country: 'DE', land: 'Berlin', city: 'Berlin' };

// =============================================
// ASSERTION HELPERS
// =============================================

function assertHasDE(feed: SourceConfig[]): void {
    const deSources = feed.filter(s => s.scope === 'DE');
    if (deSources.length === 0) {
        throw new Error('FAIL: Expected DE sources in feed, found none');
    }
}

function assertHasLand(feed: SourceConfig[], land: string): void {
    const landSources = feed.filter(s => s.scope === 'LAND' && s.geo.land === land);
    if (landSources.length === 0) {
        throw new Error(`FAIL: Expected LAND sources for ${land}, found none`);
    }
}

function assertHasCity(feed: SourceConfig[], city: string): void {
    const citySources = feed.filter(s => s.scope === 'CITY' && s.geo.city === city);
    if (citySources.length === 0) {
        throw new Error(`FAIL: Expected CITY sources for ${city}, found none`);
    }
}

function assertNoOtherCities(feed: SourceConfig[], allowedCity: string): void {
    const otherCitySources = feed.filter(s => s.scope === 'CITY' && s.geo.city !== allowedCity);
    if (otherCitySources.length > 0) {
        const cities = [...new Set(otherCitySources.map(s => s.geo.city))];
        throw new Error(`FAIL: Found unexpected CITY sources for: ${cities.join(', ')}`);
    }
}

function assertNoOtherLands(feed: SourceConfig[], allowedLand: string): void {
    const otherLandSources = feed.filter(s => s.scope === 'LAND' && s.geo.land !== allowedLand);
    if (otherLandSources.length > 0) {
        const lands = [...new Set(otherLandSources.map(s => s.geo.land))];
        throw new Error(`FAIL: Found unexpected LAND sources for: ${lands.join(', ')}`);
    }
}

function assertNoCity(feed: SourceConfig[]): void {
    const citySources = feed.filter(s => s.scope === 'CITY');
    if (citySources.length > 0) {
        const cities = [...new Set(citySources.map(s => s.geo.city))];
        throw new Error(`FAIL: Expected no CITY sources, found: ${cities.join(', ')}`);
    }
}

function assertOnlyScopes(feed: SourceConfig[], allowedScopes: string[]): void {
    const invalidSources = feed.filter(s => !allowedScopes.includes(s.scope));
    if (invalidSources.length > 0) {
        const scopes = [...new Set(invalidSources.map(s => s.scope))];
        throw new Error(`FAIL: Found unexpected scopes: ${scopes.join(', ')}. Allowed: ${allowedScopes.join(', ')}`);
    }
}

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

// =============================================
// TEST CASES
// =============================================

console.log('\n📋 CITY-Level Feed Autotests\n');
console.log('='.repeat(50));

// CASE 1: Leipzig user
test('CASE 1: Leipzig user gets DE + Sachsen + Leipzig', () => {
    const feed = resolveFeedSources(user_leipzig);

    assertHasDE(feed);
    assertHasLand(feed, 'Sachsen');
    assertHasCity(feed, 'Leipzig');
    assertNoOtherCities(feed, 'Leipzig');
    assertNoOtherLands(feed, 'Sachsen');
});

// CASE 2: München user
test('CASE 2: München user gets DE + Bayern + München', () => {
    const feed = resolveFeedSources(user_munich);

    assertHasDE(feed);
    assertHasLand(feed, 'Bayern');
    assertHasCity(feed, 'München');
    assertNoOtherCities(feed, 'München');
    assertNoOtherLands(feed, 'Bayern');
});

// CASE 3: Köln user
test('CASE 3: Köln user gets DE + NRW + Köln', () => {
    const feed = resolveFeedSources(user_cologne);

    assertHasDE(feed);
    assertHasLand(feed, 'Nordrhein-Westfalen');
    assertHasCity(feed, 'Köln');
    assertNoOtherCities(feed, 'Köln');
    assertNoOtherLands(feed, 'Nordrhein-Westfalen');
});

// CASE 4: Dresden user (has CITY package now)
test('CASE 4: Dresden user gets DE + Sachsen + Dresden', () => {
    const feed = resolveFeedSources(user_dresden);

    assertHasDE(feed);
    assertHasLand(feed, 'Sachsen');

    // Dresden now has a CITY package
    if (hasCityPackage('Dresden')) {
        assertHasCity(feed, 'Dresden');
        assertNoOtherCities(feed, 'Dresden');
    } else {
        assertNoCity(feed);
    }

    assertNoOtherLands(feed, 'Sachsen');
});

// CASE 5: Berlin city-state
test('CASE 5: Berlin city-state gets DE + Berlin LAND only (no CITY)', () => {
    const feed = resolveFeedSources(user_berlin);

    assertHasDE(feed);
    assertHasLand(feed, 'Berlin');
    assertNoCity(feed);
    assertOnlyScopes(feed, ['DE', 'LAND']);
});

// =============================================
// NEGATIVE TESTS
// =============================================

console.log('\n' + '='.repeat(50));
console.log('📋 Negative Tests (Cross-City Isolation)\n');

test('Leipzig user does NOT see München sources', () => {
    const feed = resolveFeedSources(user_leipzig);
    const munichSources = feed.filter(s => s.geo.city === 'München');
    if (munichSources.length > 0) {
        throw new Error('Leipzig user should not see München sources');
    }
});

test('München user does NOT see Leipzig sources', () => {
    const feed = resolveFeedSources(user_munich);
    const leipzigSources = feed.filter(s => s.geo.city === 'Leipzig');
    if (leipzigSources.length > 0) {
        throw new Error('München user should not see Leipzig sources');
    }
});

test('Leipzig user does NOT see Bayern LAND sources', () => {
    const feed = resolveFeedSources(user_leipzig);
    const bayernLandSources = feed.filter(s => s.scope === 'LAND' && s.geo.land === 'Bayern');
    if (bayernLandSources.length > 0) {
        throw new Error('Leipzig user should not see Bayern LAND sources');
    }
});

test('Berlin user does NOT see any CITY sources', () => {
    const feed = resolveFeedSources(user_berlin);
    const citySources = feed.filter(s => s.scope === 'CITY');
    if (citySources.length > 0) {
        throw new Error('Berlin (city-state) should not see any CITY sources');
    }
});

// =============================================
// INDEX VALIDATION TESTS
// =============================================

console.log('\n' + '='.repeat(50));
console.log('📋 Index Validation Tests\n');

test('city-packages.index.json has correct total_cities count', () => {
    const indexPath = path.join(__dirname, '..', 'city-packages.index.json');
    const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));

    if (index.total_cities !== index.packages.length) {
        throw new Error(`total_cities (${index.total_cities}) !== packages.length (${index.packages.length})`);
    }
});

test('city-packages.index.json has unique city+land combinations', () => {
    const indexPath = path.join(__dirname, '..', 'city-packages.index.json');
    const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));

    const combos = new Set<string>();
    for (const pkg of index.packages) {
        const key = `${pkg.city}|${pkg.land}`;
        if (combos.has(key)) {
            throw new Error(`Duplicate city+land: ${pkg.city}, ${pkg.land}`);
        }
        combos.add(key);
    }
});

test('Leipzig, München, Köln MUST exist in index', () => {
    const indexPath = path.join(__dirname, '..', 'city-packages.index.json');
    const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));

    const cities = index.packages.map((p: { city: string }) => p.city);
    const required = ['Leipzig', 'München', 'Köln'];

    for (const city of required) {
        if (!cities.includes(city)) {
            throw new Error(`Required city ${city} not found in index`);
        }
    }
});

test('Berlin MUST NOT exist in CITY index', () => {
    const indexPath = path.join(__dirname, '..', 'city-packages.index.json');
    const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));

    const cities = index.packages.map((p: { city: string }) => p.city);
    if (cities.includes('Berlin')) {
        throw new Error('Berlin (city-state) should NOT be in CITY index');
    }
});

// =============================================
// SUMMARY
// =============================================

console.log('\n' + '='.repeat(50));
console.log(`\n📊 Test Summary: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
    process.exit(1);
}

console.log('✅ All CITY-level feed tests passed!\n');
