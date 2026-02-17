import fs from 'fs';
import path from 'path';
import { SOURCE_REGISTRY } from '../registries/source-registry';

const DOC_PATH = path.resolve(process.cwd(), 'docs/UUDISTE_ALLIKATE_NIMEKIRI.md');

function isObject(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null;
}

/**
 * Flatten registry into individual source entries.
 * Works for:
 * - flat arrays
 * - nested objects/arrays by scope (country/bundesland/city)
 */
function flattenRegistryCount(input: unknown): number {
    if (Array.isArray(input)) {
        let count = 0;
        for (const item of input) {
            // Treat objects with id/url as a source entry
            if (isObject(item) && ('id' in item || 'source_id' in item || 'url' in item || 'base_url' in item)) count += 1;
            else count += flattenRegistryCount(item);
        }
        return count;
    }

    if (!isObject(input)) return 0;

    // Single source object
    if ('id' in input || 'source_id' in input || 'url' in input || 'base_url' in input) return 1;

    let count = 0;
    for (const v of Object.values(input)) count += flattenRegistryCount(v);
    return count;
}

function parseDocTableCount(md: string): number {
    const lines = md.split('\n').map(l => l.trim());

    return lines.filter(line => {
        if (!line.startsWith('|')) return false;

        // must be a real table row with multiple cells
        const pipes = (line.match(/\|/g) || []).length;
        if (pipes < 4) return false;

        // exclude header row (any variant containing "| ID |")
        if (/\|\s*ID\s*\|/i.test(line)) return false;

        // exclude separator row (only pipes + dashes/colons/spaces)
        if (/^\|[\s:-]*\|[\s:-]*\|[\s:-]*\|[\s:-]*\|?[\s:-]*\|?$/.test(line)) return false;

        return true;
    }).length;
}

function checkDrift() {
    console.log('🔍 Checking Registry Drift...');

    const registryCount = flattenRegistryCount(SOURCE_REGISTRY);
    console.log(`   Runtime Registry Count (flattened): ${registryCount}`);

    if (!fs.existsSync(DOC_PATH)) {
        console.error(`❌ Documentation file not found: ${DOC_PATH}`);
        process.exit(1);
    }

    const content = fs.readFileSync(DOC_PATH, 'utf-8');
    const docCount = parseDocTableCount(content);
    console.log(`   Documentation Count (Table rows): ${docCount}`);

    if (docCount !== registryCount) {
        console.error(`❌ DRIFT DETECTED! Docs say ${docCount}, but Registry has ${registryCount}.`);
        console.error('   Update docs/UUDISTE_ALLIKATE_NIMEKIRI.md to match scripts/registries/source-registry.ts');
        process.exit(1);
    }

    console.log('✅ Registry documentation matches runtime registry');
}

checkDrift();
