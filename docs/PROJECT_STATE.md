
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
