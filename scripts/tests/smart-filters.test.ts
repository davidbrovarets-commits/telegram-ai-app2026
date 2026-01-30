
import { isDeepLink, isRecentNews } from '../helpers';

async function test(name: string, fn: () => void) {
    try {
        process.stdout.write(`Testing ${name}... `);
        fn();
        console.log('✅ PASS');
    } catch (error) {
        console.log('❌ FAIL');
        console.error(error);
        process.exit(1);
    }
}

console.log('\n🧹 Filter Logic Tests (Freshness & Deep Links)\n');

test('isDeepLink rejects root domains', () => {
    if (isDeepLink('https://www.muenchen.de/')) throw new Error('Root domain accepted');
    if (isDeepLink('https://ru.muenchen.de/')) throw new Error('Root domain accepted');
});

test('isDeepLink accepts deep article URLs', () => {
    if (!isDeepLink('https://ru.muenchen.de/2026/20/Registrierbescheide-fuer-gefoerderte-Wohnungen-gelten-laenger-122594')) throw new Error('Deep link rejected');
    if (!isDeepLink('https://www.stadt-koeln.de/politik-und-verwaltung/presse/mitteilungen/26450/index.html')) throw new Error('Deep link rejected');
});

test('isRecentNews rejects 2024 content', () => {
    const oldContent = "Ausstellung ist bis 20. Oktober 2024 im Museum Schnütgen zu sehen. Donnerstag, 1. Februar 2024.";
    if (isRecentNews(oldContent, 'http://url.com')) throw new Error('2024 content accepted');
});

test('isRecentNews accepts 2026 content', () => {
    const newContent = "Regelungen ab März 2026. Heute, 30.01.2026.";
    if (!isRecentNews(newContent, 'http://url.com')) throw new Error('2026 content rejected');
});

test('isRecentNews rejects specific old date (e.g. 01.01.2025)', () => {
    // Current date is 2026-01-30. 01.01.2025 is old.
    if (isRecentNews("Datum: 01.01.2025", 'http://url.com')) throw new Error('Old date accepted');
});
