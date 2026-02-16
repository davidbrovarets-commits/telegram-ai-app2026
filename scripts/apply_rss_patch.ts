
import * as fs from 'fs';
import * as path from 'path';

// POINTS TO VALIDATION REPORT
const REPORT_PATH = path.join('docs', 'audits', 'RSS_DISCOVERY_REPORT.md');
const REGISTRY_PATH = path.join('scripts', 'registries', 'source-registry.ts');

function main() {
    console.log('--- PATCH 1: APPLIYING VALID RSS FEEDS ---');

    if (!fs.existsSync(REPORT_PATH)) {
        console.error('Report not found at', REPORT_PATH);
        process.exit(1);
    }

    const reportContent = fs.readFileSync(REPORT_PATH, 'utf-8');
    const registryContent = fs.readFileSync(REGISTRY_PATH, 'utf-8');

    // 1. EXTRACT FROM TABLE
    // Matches: | **source_id** | `current_url` | `discovered_url` | evidence |
    const regex = /\| \*\*([a-z0-9_]+)\*\* \| `[^`]+` \| `([^`]+)` \|/g;

    const updates = new Map<string, string>();
    let match;
    while ((match = regex.exec(reportContent)) !== null) {
        const id = match[1];
        const newUrl = match[2];

        // Safety Filter: Podcasts
        if (newUrl.includes('podcast') || newUrl.includes('audio')) {
            console.warn(`⚠️ SKIPPING ${id}: URL looks like podcast/audio: ${newUrl}`);
            continue;
        }

        updates.set(id, newUrl);
    }

    console.log(`Found ${updates.size} valid RSS updates to apply.`);

    // 2. APPLY TO REGISTRY
    let newRegistry = registryContent;
    let appliedCount = 0;

    // Iterate map and replace
    // Look for: source_id: "ID", then capture the block or just strict replace?
    // Structure:
    // {
    //    source_id: "bw_swr",
    //    ...
    //    base_url: "OLD_URL",
    // }
    // We can regex replace based on source_id proximity?
    // Or simpler: strictly replace the exact line if we find the block?

    // Better: Regex for the specific source block.
    // source_id:\s*"ID"[\s\S]*?base_url:\s*"([^"]+)"

    for (const [id, url] of updates) {
        // Regex to find the base_url for this specific source_id
        // We look for source_id: "id" ... base_url: "..."
        // We need to be careful not to match partial IDs (e.g. "a" matching "abc")
        // source_ids are quoted.

        const blockRegex = new RegExp(`(source_id:\\s*"${id}",[\\s\\S]*?base_url:\\s*")([^"]+)(")`, 'g');

        if (blockRegex.test(newRegistry)) {
            newRegistry = newRegistry.replace(blockRegex, (m, prefix, oldUrl, suffix) => {
                if (oldUrl === url) return m; // No change
                return `${prefix}${url}${suffix}`;
            });
            appliedCount++;
        } else {
            console.warn(`❌ Could not find source_id entry for: ${id}`);
        }
    }

    // 3. WRITE BACK
    fs.writeFileSync(REGISTRY_PATH, newRegistry);
    console.log(`✅ Successfully updated ${appliedCount} sources in source-registry.ts`);
}

main();
