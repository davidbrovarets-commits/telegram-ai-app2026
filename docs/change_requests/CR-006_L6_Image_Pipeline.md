# CHANGE_REQUEST: CR-006 — L6 IMAGE PIPELINE & UI CONTRACT (REVISION A)

## 0. Governance Entry
This Change Request is valid ONLY if the agent performs the mandatory governance check in this exact order:
1) AI_GOVERNANCE.md
2) project_knowledge.md
3) docs/core_surface.md
4) CHANGE_REQUEST.md (this file)
Proceed ONLY if all checks pass.

Pre-Action Governance Check: **OK**

---

## 1. Change Goal
Implement a deterministic async image pipeline for `news_items` (placeholder → generating → generated/failed), introduce "Real-world anchored" banners (Reference-first → Imagen 4 fallback), and enforce a strict UI rendering contract for news cards.

---

## 2. Change Classification
**CORE**
(Changes Core Data Models `news_items`, Core Pipelines `banner generation`, and Core UI feed rendering contract.)

---

## 3. Explicit Boundaries (What MUST NOT change)
### 3.1 Hotfix L6 Protection (Non-Negotiable)
- `src/lib/net/defensiveFetch.ts` must remain intact. NO modifications.
- Swipe behavior must remain intact: **Left = Archive, Right = Delete**. NO semantic changes.

### 3.2 SwipeableNewsCard.tsx Allowed Change Scope (Important Clarification)
`src/components/views/SwipeableNewsCard.tsx` may be modified ONLY for:
- layout adjustments required by the UI Contract (single column / spacing / placement),
- text deduplication (pre-line vs summary),
- placeholder rendering behavior (UI-only).

STRICTLY FORBIDDEN inside `SwipeableNewsCard.tsx`:
- any changes to gesture/swipe logic, handlers, thresholds, direction mapping,
- any changes that alter left/right semantics,
- refactoring/renaming/cleanup unrelated to contract enforcement.

### 3.3 No General Refactoring
- No renames, no cleanup, no restructures.
- Only changes directly required by this CR.

### 3.4 UI Non-Blocking Rule
- Frontend must NEVER block rendering on banner generation.
- Placeholders must always render immediately.

---

## 4. Imagen 4 Availability & Fallback Rule (Deterministic)
The system MUST target **Imagen 4** for fallback generation.

If Imagen 4 is unavailable at runtime (quota/permission/API error):
- Mark item as `image_status = failed`
- Store a short reason in `image_error`
- Increment attempts once
- DO NOT infinite-loop
- UI remains on placeholder (never blocks)

This guarantees deterministic behavior even when Imagen 4 cannot be called.

---

## 5. Acceptance Criteria
1) **Database**
   - `news_items` gains deterministic image pipeline columns (status, attempts, error, source type, etc.).
   - Migration runs cleanly and is non-breaking (safe defaults).

2) **Pipeline**
   - `claimNewsForGeneration` picks oldest `placeholder` items deterministically.
   - Respects `maxAttempts`.
   - Uses explicit status transitions:
     - placeholder → generating → generated
     - placeholder/generating → failed (on hard error)

3) **Banners**
   - Reference-first:
     - use a real-world reference image (e.g., Wikipedia/Wikimedia) when available.
   - Fallback:
     - if no reference exists, use **Imagen 4** with documentary policy prompt.
   - No infinite loops; state updates always converge.

4) **UI Contract**
   - Single column only.
   - No duplicate text (pre-line vs summary must not repeat).
   - Swipe works exactly as before (Left=Archive, Right=Delete).
   - 6 cards visible on the main feed (MVP).

---

## 6. Rollback Plan
- Revert commits in reverse order.
- Database columns can remain (non-breaking) and may be ignored by older code if rollback occurs.

---

## 7. Implementation Plan Alignment (Binding)
Agent must implement using the following high-level plan (no refactor, minimal diffs):
1) DB migration: add image status columns to `news_items`.
2) Shared image status library: claim/markGenerated/markFailed.
3) Docs: IMAGE_PIPELINE_L6.md and UI_NEWS_CARD_CONTRACT_L6.md.
4) Banner job: Reference-first; Imagen 4 fallback; uses status library.
5) UI: enforce single column and text dedup; preserve swipe semantics; placeholder-first.

---

## 8. Verification Plan (Binding)
### Automated / Local
- Run migration.
- `npm run dev` → UI renders placeholders (no blocking).

### Manual
- Confirm `news_items.image_status` transitions in Supabase.
- Confirm real-world reference selection works on at least one known item.
- Confirm swipe Left/Right semantics in UI remain unchanged.

---

## 9. Owner & Authorization
Owner: **David Brovarets (User)**  
Executor: **Antigravity (Agent)**

Authorization to start work under this CR revision:
Status: **APPROVED — GO WORK after governance check passes.**
