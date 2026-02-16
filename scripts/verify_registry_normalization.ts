
import { SOURCE_REGISTRY } from './registries/source-registry';
import * as fs from 'fs';
import * as path from 'path';

const REGISTRY_PATH = path.join('scripts', 'registries', 'source-registry.ts');

function main() {
    console.log('--- PATCH 4: VERIFYING REGISTRY NORMALIZATION (V2) ---');

    const content = fs.readFileSync(REGISTRY_PATH, 'utf-8');
    const lines = content.split('\n');

    let total = 0;
    let validXml = 0;
    let annotatedNoFeed = 0;
    let violations = 0;

    for (const line of lines) {
        if (line.trim().startsWith('base_url:')) {
            total++;
            const urlMatch = line.match(/"([^"]+)"/);
            if (!urlMatch) continue;

            const url = urlMatch[1].toLowerCase();
            const hasNoFeed = line.includes('// NO_FEED');

            // Expanded valid XML patterns
            const isXml = url.endsWith('.xml')
                || url.endsWith('.rss')
                || url.includes('/rss')
                || url.endsWith('.feed') // WDR style
                || url.includes('/feed')
                || url.includes('.rdf')
                || url.includes('xml')
                || url.includes('json')
                || url.includes('?view=rss') // Weser Kurier
                || url.includes('sp-mode=rss'); // Mainz

            if (hasNoFeed) {
                annotatedNoFeed++;
            } else if (isXml) {
                validXml++;
            } else {
                // If it STILL looks like HTML
                const isSuspiciousHtml = !url.includes('/rss')
                    && !url.includes('/feed')
                    && !url.includes('.xml')
                    && !url.includes('service');

                if (isSuspiciousHtml) {
                    console.error(`❌ VIOLATION: Source line seems to be HTML but no NO_FEED tag: \n   ${line.trim()}`);
                    violations++;
                } else {
                    validXml++;
                }
            }
        }
    }

    console.log(`\nRESULTS:`);
    console.log(`- Total URLs scanned: ${total}`);
    console.log(`- Valid Feeds (RSS/Atom/etc): ${validXml}`);
    console.log(`- Annotated No-Feed: ${annotatedNoFeed}`);
    console.log(`- Violations: ${violations}`);

    if (violations === 0) {
        console.log('✅ VERIFICATION PASSED');
    } else {
        console.error('❌ VERIFICATION FAILED');
        process.exit(1);
    }
}

main();
