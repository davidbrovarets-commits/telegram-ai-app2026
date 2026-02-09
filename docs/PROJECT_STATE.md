
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
