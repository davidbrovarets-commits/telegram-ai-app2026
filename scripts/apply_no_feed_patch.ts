
import * as fs from 'fs';
import * as path from 'path';

const REPORT_PATH = path.join('docs', 'audits', 'RSS_DISCOVERY_REPORT.md');
const REGISTRY_PATH = path.join('scripts', 'registries', 'source-registry.ts');

function main() {
    console.log('--- PATCH 2: ANNOTATING NO_FEED SOURCES ---');

    const reportContent = fs.readFileSync(REPORT_PATH, 'utf-8');
    let registryContent = fs.readFileSync(REGISTRY_PATH, 'utf-8');

    // Regex to capture the NO_FEED table section
    // Starts with "## 4. No Feed Found" and ends at EOF.
    const noFeedSection = reportContent.split('## 4. No Feed Found')[1];
    if (!noFeedSection) {
        console.error('Could not find No Feed section in report');
        process.exit(1);
    }

    // Matches lines: | source_id | `url` | reason |
    const rowRegex = /\| ([a-z0-9_]+) \| `[^`]+` \| ([^|]+) \|/g;

    let appliedCount = 0;
    let match;
    while ((match = rowRegex.exec(noFeedSection)) !== null) {
        const id = match[1].trim();
        const reason = match[2].trim();

        // Find the block in registry
        // Look for: source_id: "id" ... base_url: "url",
        // And append comment to the base_url line if not already present

        const blockRegex = new RegExp(`(source_id:\\s*"${id}",[\\s\\S]*?base_url:\\s*"[^"]+",?)`, 'g');

        if (blockRegex.test(registryContent)) {
            registryContent = registryContent.replace(blockRegex, (m) => {
                if (m.includes('// NO_FEED')) return m; // already annotated
                return `${m} // NO_FEED (reason: ${reason})`;
            });
            appliedCount++;
        }
    }

    fs.writeFileSync(REGISTRY_PATH, registryContent);
    console.log(`✅ Annotated ${appliedCount} sources with // NO_FEED tags.`);
}

main();
