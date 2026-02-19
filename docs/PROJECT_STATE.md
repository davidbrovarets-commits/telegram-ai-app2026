
---

## AI Inspector & Legacy Purge (Patches A0–CLEAN1)

### Patch Status
- **A0 (Contract)**: ✅ Configured (`docs/AI_INSPECTOR_CONTRACT.md`).
- **A1 (Runtime)**: ✅ Scheduled Workflow (15m) + Inspector Skeleton.
- **A2 (Reporting)**: ✅ JSON Report + GitHub Job Summary (Rich Markdown).
- **A3 (AutoFix)**: ✅ Level 0 (Lock Release) implemented (Gated via Env).
- **A4 (Monitor)**: ✅ 48h Metrics Aggregation (Read-Only).
- **B0 (Triggers)**: ✅ Event Rules Documented (see below).
- **B1 (Integration)**: ✅ `workflow_run` triggers on Generator Failure.
- **B2 (Guardrails)**: ✅ Infinite Loop Protection (Paused by default).
- **CLEAN-1**: ✅ deterministic purge plan (`legacy_image_purge.ts` + workflow).

### Trigger Rules (Event-Driven Inspection)
1.  **Source**: `workflow_run` (Conclusion != 'success').
2.  **Target Workflow**: "News Images Generator".
3.  **Action**: Run `ai-inspector-on-failure.yml`.
4.  **Constraints**:
    - **Concurrency**: Group `ai-inspector-event` with `cancel-in-progress`.
    - **AutoFix**: HARD DISABLED (`INSPECTOR_ALLOW_LOCK_RELEASE="false"`) to prevent repair loops.
5.  **Stop Condition**: If Inspector status is FAIL (P0), human intervention is required.

### Legacy Purge Strategy
- **Mode 1 (Default)**: Dry Run (List Only). Artifact produced: `legacy-delete-list.json`.
- **Mode 2 (Action)**: Delete. Requires `LEGACY_PURGE_APPROVE="true"` in workflow dispatch.
- **Safety**: Post-delete verification scans DB for broken links.

## Ingestion & Source Registry (Patches RSS-NORM)

### Policy
- **Format**: All sources must provide a valid **RSS/Atom XML** feed.
- **HTML Handling**: Raw HTML homepage URLs are **NOT supported** for ingestion.
- **No-Feed Protocol**: Sources without a discoverable feed must be explicitly annotated in `source-registry.ts` with `// NO_FEED (reason: ...)`.
- **Normalization**: The registry has been normalized (Feb 2026) to replace ~90 HTML URLs with discovering feeds and annotate ~140 missing ones.

## Known Issues / Risks

### Risk: Local auth fragility in Vertex client
Vertex access token retrieval must not rely on machine-specific absolute paths or PowerShell-only execution.
Policy:
- Use `gcloud auth print-access-token` via PATH with `shell: true` for local dev fallback.
- Do not silently default projectId; fail-fast if missing.
- Imagen model must be configurable via `VERTEX_IMAGEN_MODEL` to prevent unintended model usage during stabilization.

### Resolved Issues
- ✅ FIXED: Archive News — Click on card did not open news detail. Cause: Missing navigation/state handler. Fix: Wired `ArchiveView` click to `NewsView` selection state, ensuring detail view renders over archive view. Smoke-test: Open Archive -> Click Item -> Detail Opens.

## Execution Governance v1.0 (GitHub Actions)
**Status:** Enforced (incident-driven hardening)
**Rule:** Never couple heavy workflows by time; couple by DB state.
**Concurrency:** Every heavy workflow must include:
```yaml
concurrency:
  group: ag-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```
**Cron Deconflict:** Heavy workflows must not start on the same minute (avoid minute 0).
**Incident Freeze:** During stabilization/patching and any AI-provider incident, all schedules must be disabled and all in-progress runs cancelled before changes and tests.
**Reactivation Order:** Monitor → Orchestrator → Image Generator → Auto-Healer → Secretary → Weekly jobs.

- **CI Node Standard:** GitHub Actions for operational workflows must run on Node.js **20** (project runtime baseline).
- **Vertex Auth:** CI uses ADC (google-github-actions/auth). No `VERTEX_API_KEY` in workflow env.

## Safety Hardening (Patch DRY-RUN)
- **Hard Mutation Guard**: `scripts/lib/mutation-guard.ts` enforces `DRY_RUN` checks at the code level.
- **Local Default**: `DRY_RUN=true` (via `scripts/local-dev-run.ts`). Explicit `DRY_RUN=false` required for mutations.
- **Production**: All mutating workflows explicitly set `DRY_RUN='false'`.
- **CI**: `ci-smoke` runs with `DRY_RUN=true` to verify logic without side effects.

### Governance Alignment Check (Post DRY_RUN Patch)
- **Node 20** enforced across all workflows.
- **Concurrency blocks** verified on heavy jobs.
- **Cron deconflict** applied (no minute 0 overlap).
- **Vertex auth** standardized via ADC (no API keys).

# Hardening Patch (Determinism/Failures/Costs/Drift)

- **Determinism**: URL hash, title similarity dedup, per-scope caps.
- **Failure Modes**: Safe fallbacks for RSS/AI/Imagen failures.
- **Cost Controls**: Token caps, max AI/Imagen calls per run, concurrency limits.
- **Registry Drift Guard**: CI checks `source-registry.ts` vs docs count.
- **Documentation**: All policies documented and enforced.

## Registry Drift Guard

Added CI enforcement preventing divergence between:

- Runtime registry (scripts/registries/source-registry.ts)
- Documentation list (docs/UUDISTE_ALLIKATE_NIMEKIRI.md)

CI workflow: registry-drift-check.yml

Status: ACTIVE

## Production Verification / Web UI

`/production` (LIVE Production State View):
- Shows build SHA, build time, deploy run ref, branch, environment label.
- Shows Supabase target fingerprint (URL domain only) + anon key present boolean.
- Renders real production news feed read-only.
- Operator uses SHA match against latest Deploy-to-Firebase run to confirm navitec.com is current.

## Production Mutation Mode (Audit Confirmation — Feb 2026)

| Trigger | DRY_RUN Value | Behavior |
|---|---|---|
| **Scheduled** (cron) | `'false'` | **LIVE WRITES** — DB inserts, deletes, image uploads |
| **Manual** (workflow_dispatch) | configurable (`true`/`false`) | User chooses on dispatch |
| **CI smoke** | `'true'` | Read-only verification, no side effects |
| **Local dev** (`npm run dev:dry`) | `'true'` (default) | Safe simulation |

**Safety mechanisms:**
- Unique index on `news.link` → deterministic upsert (no duplicates)
- `assertMutationAllowed()` code-level guard in every write path
- `cancel-in-progress` concurrency prevents overlapping runs

## Operational Runbooks

### Purge All News Everywhere (DB + Storage)

**Preconditions:** disable schedules + cancel runs + `PURGE_NEWS_CONFIRM` gate + `DRY_RUN` default true

**Command:**
```bash
# Dry run (safe — logs what would be deleted)
DRY_RUN=true  PURGE_NEWS_CONFIRM="YES_DELETE_ALL_NEWS_EVERYWHERE" npm run admin:purge-news

# Live purge (destructive — deletes all news data)
DRY_RUN=false PURGE_NEWS_CONFIRM="YES_DELETE_ALL_NEWS_EVERYWHERE" npm run admin:purge-news
```

**Post-checks:** DB row counts = 0; Storage objects = 0; then run orchestrator manually for clean regen test.

### Verify ZERO News State

**Command:**
```bash
EXPECT_ZERO_NEWS="YES" FAIL_ON_LEFTOVERS=true npm run admin:verify-zero-news
```

**Pass criteria:** Script prints "✅ VERIFIED: ZERO NEWS EVERYWHERE". All DB rowCounts = 0 and all Storage objectCounts = 0.

## Operations / Diagnostics

- Added manual-only workflow `.github/workflows/vertex-diag.yml` and script `scripts/diag_vertex_text.ts` to verify Vertex text model reachability by (project, region, credentials). Purpose: detect Studio vs Pipeline mismatch causing model 404 in production. Read-only; no DB/Storage mutations; safe under Mutation Guard. Default model stabilized to `gemini-2.5-pro`.
