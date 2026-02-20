MODEL DECISION:
[EXECUTOR]

REASON:
[Brief technical justification]

USE MODEL:
[EXECUTOR MODEL (Gemini / action-first)]

================================================================================
AG TASK FILE — [TASK TITLE] — NAVESTIC
================================================================================

EXECUTION MODE:
[SAFE PATCH / DEEP INVESTIGATION]

PRECONDITIONS (MUTATION GUARD — MUST DO FIRST)
- STOP background mutations: cancel any “In progress” GitHub Actions runs + disable scheduled workflows where applicable.
- Confirm Actions page shows: 0 runs “In progress” via GH CLI.
- Run `npx tsx scripts/ops/preflight_mutation.ts`

RUNTIME RULE — “НЕ СМОТРИ, А ЧИТАЙ”
- No browser verification. Use deterministic evidence only.

GOAL
[Specific deterministic objective]

SCOPE
IN SCOPE:
- [Item]

OUT OF SCOPE (DO NOT DO):
- [Item]

FILES TO MODIFY
- [File paths]

SEQUENTIAL CHANGESET (MICRO-COMMITS) — 1 CHANGE = 1 GOAL = 1 TEST
1) [Step 1 description]

ACCEPTANCE TESTS
1) [Deterministic test: e.g. SQL select count, ripgrep output, diff]

STOP CONDITIONS (HARD)
- [What fails the task immediately]

DELIVERABLES
1) Create Evidence Pack: `npx tsx scripts/ops/write_evidence_pack.ts`
2) Capture artifact outputs.

FINAL STEP
- Push branch: `git push -u origin <branch>`

END
