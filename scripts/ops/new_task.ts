import * as fs from 'fs';
import * as path from 'path';
import { parseArgs } from 'util';

const { values } = parseArgs({
    options: {
        title: { type: 'string', short: 't' },
        type: { type: 'string', short: 'y' },
        goal: { type: 'string', short: 'g' }
    }
});

const title = values.title || '[TASK TITLE]';
const type = values.type || 'SAFE_PATCH|INVESTIGATION|DEEP';
const goal = values.goal || '[1-2 sentences strictly defining the objective]';

let modelDecision = '';
if (type === 'INVESTIGATION') {
    modelDecision = `MODEL DECISION:
ANALYST

REASON:
This is an investigation/discovery task that requires deep context gathering without mutations to the system.

USE MODEL:
ANALYST MODEL (Claude / reasoning-first)`;
} else {
    modelDecision = `MODEL DECISION:
EXECUTOR

REASON:
This is a concrete implementation task requiring strict mutation discipline and script execution.

USE MODEL:
EXECUTOR MODEL (Gemini / action-first)`;
}

const template = `AG TASK FILE — ${title}

${modelDecision}

========================================================
LLM EXECUTION DIRECTIVE (FULL) — NAVESTIC / ANTIGRAVITY
========================================================
- Architecture Model L0–L6: keep boundaries explicit.
- SSOT: DB authoritative; avoid visual assumptions.
- Determinism: evidence via CLI/SQL outputs, commit SHAs.

========================================================
RUNTIME RULE — “НЕ СМОТРИ, А ЧИТАЙ” (MANDATORY)
========================================================
FORBIDDEN:
- Browser / UI visual confirmation.
ALLOWED:
- Deterministic checks: gh CLI, file diffs, SQL outputs, script logs.

========================================================
PRECONDITIONS (MUTATION GUARD — MUST DO FIRST)
========================================================
STOP background mutations.
1) Verify 0 runs "in progress" using: \`gh run list --status in_progress\`
2) Disable schedules as defined in evidence standards.
You can use \`npx tsx scripts/ops/preflight_mutation.ts\` to enforce this automatically.

========================================================
TASK CLASSIFICATION
========================================================
${type}

========================================================
GOAL
========================================================
${goal}

========================================================
SCOPE
========================================================
IN SCOPE:
- [List specific boundaries]

OUT OF SCOPE:
- [List specific exclusions]

========================================================
CHANGESET (EXACT EDIT INSTRUCTIONS)
========================================================
- [Step 1]
- [Step 2]

========================================================
ACCEPTANCE TESTS (1 GOAL = 1 TEST)
========================================================
- [Test 1]

========================================================
POST-STEPS (EVIDENCE PACK)
========================================================
1. After verification, generate evidence using:
   \`npx tsx scripts/ops/write_evidence_pack.ts --title "${title}" --scope "..."\`
2. Git commit + Push.

END AG TASK FILE
`;

console.log(template);
process.exit(0);
