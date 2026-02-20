# PROCESS OPERATING CARD (A4 Checklist)

**Core Directives for Navestic / Antigravity Agent Operations**

### 1. The Entry Point
Always start a new task using the provided template skeleton:
\`npx tsx scripts/ops/new_task.ts --title "Your Task" --type "SAFE_PATCH" --goal "Your Goal"\`
- This ensures LLM models have standard constraints right away.

### 2. Model Decision Matrix
- **ANALYST:** Used for investigations, deep dives, planning, and read-only context gathering.
- **EXECUTOR:** Used for applying deterministic patches, data cleanup scripts, and verified changes.
- **NEVER MIX:** If a task requires analysis and implementation, split it into 2 tasks.

### 3. One Goal = One Test
- Each task MUST have a single deterministic goal.
- Stop conditions must prevent compounding regressions.
- No UI / Browser verification allowed. CLI / DB evidence only.

### 4. Mandatory Preflight Checks
Before starting any implementation (Executor mode), run:
\`npx tsx scripts/ops/preflight_mutation.ts\`
- Confirms GitHub auth.
- Confirms 0 "in progress" actions.
- Confirms scheduled workflows are paused.

### 5. Mandatory Evidence Standard
After executing a task, run the evidence pack generator:
\`npx tsx scripts/ops/write_evidence_pack.ts --title "My Task" --scope "Patch..." --notes "Success"\`
- Proof of mutation (SQL Output) and proof of deployment (Commit SHA / Run ID).

### 6. Emergency Rollback Triggers
- Preflight failure -> STOP.
- Uncaught pipeline logs -> STOP.
- Any unauthorized DB DB changes -> Revert Commit / Use DB snapshot backup if critical.
