
# Execution Governance (MVP)

**Purpose:** prevent overlapping runs, retry storms, and burst-pattern API usage that can trigger provider suspensions.
**Non-goals:** no new orchestration services; no scale architecture.

## Controls

1.  **Concurrency:** `cancel-in-progress` for every heavy workflow.
2.  **Cron Deconflict:** Heavy workflows must not start on the same minute (avoid minute 0).
3.  **Incident Freeze:** During stabilization/patching and any AI-provider incident, all schedules must be disabled and all in-progress runs cancelled before changes and tests.
4.  **Reactivation Order:** Monitor → Orchestrator → Image Generator → Auto-Healer → Secretary → Weekly jobs.
- **Auth Standard (CI):** Workflows must use `google-github-actions/auth@v2` (ADC). Do **not** pass `VERTEX_API_KEY` via workflow env. Vertex access must be via centralized vertex-client and ADC tokens.

### CI Runtime Enforcement (Feb 2026)
All operational GitHub Actions workflows MUST run on:
- **Node.js 20** (project runtime baseline).
- No workflow may use Node 18.

## 4. Mutation Guards (Hard Enforcement)
As of Feb 2026, we enforce a **Code-Level Mutation Guard** (`scripts/lib/mutation-guard.ts`).

### Rules
1. **Default Safety**: The system defaults to `DRY_RUN=true` if the env var is missing or not explicitly 'false'.
2. **Explicit Production**: All production workflows MUST explicitly set `DRY_RUN='false'` in their environment configuration.
3. **Usage**:
   - Wrap ALL database writes and Storage uploads with `assertMutationAllowed('scope:action')`.
   - Use `if (isDryRun()) ...` for high-level logic skipping.

### Development Loop
- **`npm run dev:dry`**: (Default) Runs safely. Logs "Would insert...".
- **`npm run dev:run`**: (Manual) Runs with real mutations. Use with caution.

### Registry Drift Guard (CI)

A CI job compares the authoritative registry (`scripts/registries/source-registry.ts`) against the documentation list (`docs/UUDISTE_ALLIKATE_NIMEKIRI.md`). Mismatches fail the workflow to prevent silent drift.

### Per-run Metrics (Local Artifacts)

Runs produce a local JSON metrics artifact (e.g., `artifacts/run-metrics.json`) to track failures, dedup drops, AI/image outcomes, and selection counts without introducing new services.
