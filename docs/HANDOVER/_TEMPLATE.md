# HANDOVER DOCUMENT

**Date/Time:** YYYY-MM-DD HH:MM  
**Branch:** `[current-working-branch]`  
**Last Known Good Commit SHA:** `[sha]`  
**Active PRs:** `[link or None]`

---

## 1. DO FIRST IN NEW CHAT
- Read `PROJECT_STATE.md` to establish project baselines.
- Read this `HANDOVER` doc.
- Run `npx tsx scripts/ops/preflight_mutation.ts` to confirm stable mutation state.

## 2. Current Focus + Next 3 Steps
We are currently working on: `[High-level objective, e.g. stabilizing the L6 Orchestrator]`.

Next steps to execute:
1. `[e.g. Write evidence pack for the previous task]`
2. `[e.g. Create AG TASK FILE for fixing auth layer]`
3. `[e.g. Execute AG TASK FILE via Gemini]`

## 3. Known Facts Table

| Context | Value / Reference |
|---|---|
| Toolchain | Node 20 (CI) / Node 24 (Local), gh, supabase CLI, gcloud |
| Auth status | Google ADC active, Supabase Admin active |
| Schedules | ONLY `news-orchestrator.yml` is active |
| Model Config SSOT | See `docs/CR/CR-009-MODEL-SSOT-CONSOLIDATION.md` for proposal |

---

## Quick References (Process OS)
- **SOP:** `docs/OPS_ONE_CHAT_SOP.md`
- **Entry Template:** `docs/OPS_ENTRY_TEMPLATE.md` 
- **Evidence Standard:** `docs/OPS_EVIDENCE_STANDARD.md`
- **Preflight Check:** `scripts/ops/preflight_mutation.ts`
- **Evidence Generator:** `scripts/ops/write_evidence_pack.ts`
- **Task Templates:** `tasks/` directory
