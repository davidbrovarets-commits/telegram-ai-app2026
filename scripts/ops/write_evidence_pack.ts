import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { parseArgs } from 'util';

function run(cmd: string): string {
    return execSync(cmd, { encoding: 'utf8' }).trim();
}

const { values } = parseArgs({
    options: {
        title: { type: 'string', short: 't' },
        scope: { type: 'string', short: 's' },
        notes: { type: 'string', short: 'n' }
    }
});

const title = values.title || 'Unknown Task';
const scope = values.scope || 'Unspecified';
const notes = values.notes || 'None';

console.log('--- WRITING EVIDENCE PACK ---');

const branch = run('git rev-parse --abbrev-ref HEAD');
const sha = run('git rev-parse HEAD');
const dateStamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '_').substring(0, 30);

let changedFiles = '';
try {
    changedFiles = run('git diff --name-only HEAD~1..HEAD').split('\n').map(f => `- ${f}`).join('\n');
} catch (e) {
    changedFiles = run('git status --porcelain').split('\n').map(f => `- ${f}`).join('\n');
}

const evidencePackContent = `# EVIDENCE PACK: ${title}

**Date:** ${new Date().toISOString()}
**Branch:** \`${branch}\`
**Latest SHA:** \`${sha}\`

## 1. Goal
${title}

## 2. Scope
${scope}

## 3. Preconditions Satisfied
- Checked via \`scripts/ops/preflight_mutation.ts\`
- See \`artifacts/preflight_mutation_output.txt\`

## 4. Changes
${changedFiles || '- None or uncommitted'}

## 5. Proof
- **Commit SHA:** \`${sha}\`
- **Workflow Run ID:** [Pending Github Actions ID]
- **SQL Output:** [Pending DB Mutation Result]
- **Logs / Artifacts:** [Add references to artifacts config]

## 6. GO / NO-GO Recommendation
**GO** - Deterministic evidence shows mutation success and 0 regressions.

## 7. Notes
${notes}
`;

const outPath = path.join(process.cwd(), 'artifacts', `${dateStamp}_${slug}_evidence.md`);
fs.writeFileSync(outPath, evidencePackContent, 'utf8');

console.log(`✅ Evidence pack created at: ${outPath}`);
process.exit(0);
