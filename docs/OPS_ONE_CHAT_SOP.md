# ONE CHAT, TWO MODES SOP (Antigravity-Only)

**Rule:** Work in a single Antigravity chat to avoid split-brain context loss.

Every task must sequentially follow these 3 blocks:

---

## 1. MODE: ORCHESTRATOR (READ-ONLY)
**Goal:** Define the objective and constraints deterministically before any mutation.

- **Define:** Goal / Scope / Out of Scope
- **Define:** Acceptance Tests + Stop Conditions
- **Produce:** AG TASK FILE (output to chat or save to `artifacts/tasks/`)

---

## 2. MODE: EXECUTOR (WRITE)
**Goal:** Implement the validated AG TASK FILE deterministically.

1. **Pre-flight:** Run `npx tsx scripts/ops/preflight_mutation.ts`
2. **Execute:** Create branch (if applicable), implement changes, run tests (code/SQL).
3. **Evidence:** Create evidence pack: `npx tsx scripts/ops/write_evidence_pack.ts`
4. **Deploy:** Push branch / merge per project policy.

---

## 3. MODE: REVIEW (READ-ONLY)
**Goal:** Prove the mutation succeeded and decide next steps.

- **Verify:** Evidence pack (SHA / run_id / SQL output references)
- **Decide:** GO/NO-GO
- **Output:** Write Next Step

---

## Chat Switching Protocol
Continuous chats eventually degrade in context window or performance. When switching to a new Antigravity chat:

1. **Before leaving the old chat:** Generate `docs/HANDOVER/HANDOVER_YYYY-MM-DD_HHMM.md` summarizing active context, latest evidence packs, and immediate next steps.
2. **Upon entering the new chat:** Start by reading the latest `HANDOVER_YYYY-MM-DD_HHMM.md` file to resume context immediately.
