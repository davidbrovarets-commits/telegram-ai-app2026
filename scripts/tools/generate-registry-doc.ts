import fs from 'fs';
import path from 'path';
import { SOURCE_REGISTRY } from '../registries/source-registry';

const DOC_PATH = path.resolve(process.cwd(), 'docs/UUDISTE_ALLIKATE_NIMEKIRI.md');

function generateDoc() {
    const count = SOURCE_REGISTRY.length;
    const header = `⚠ This file is documentation only.
Authoritative source registry: \`scripts/registries/source-registry.ts\`
CI enforces drift checks. If you change the registry, update this document in the same PR.

Registry Count: ${count}
`;

    let lines = [header, ''];
    lines.push('# Uudiste Allikate Nimekiri (News Sources List)');
    lines.push('');

    // Group by trust level or priority? Or just list?
    // Let's list by ID.

    // Sort by name
    const sorted = [...SOURCE_REGISTRY].sort((a, b) => a.name.localeCompare(b.name));

    lines.push('| ID | Nimi | URL | Usaldus | Prioriteet |');
    lines.push('|---|---|---|---|---|');

    for (const s of sorted) {
        lines.push(`| \`${s.source_id}\` | ${s.name} | [Link](${s.base_url}) | ${s.trust_level} | ${s.default_priority} |`);
    }

    lines.push('');
    lines.push(`*Generated at ${new Date().toISOString()}*`);

    fs.writeFileSync(DOC_PATH, lines.join('\n'));
    console.log(`✅ Generated docs/UUDISTE_ALLIKATE_NIMEKIRI.md with ${count} sources.`);
}

generateDoc();
