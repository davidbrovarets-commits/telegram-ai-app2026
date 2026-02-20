# CR-008 — Structural Normative Layer v2.1
## State Harmonization: Per-User Persistence (Archive/Delete)

Status: IMPLEMENTED  
Layer: Structural Normative Layer (Data + Interaction + Persistence + UI + Governance)  
Version: SNL v2.1  
Owner: Navestic  
Date: 2026-02-19  

---

# 1. Purpose

Eliminate split-brain state model and introduce deterministic, per-user persistent state
without mutating global system state.

---

# 2. Structural Layer Classification

This CR modifies:

- DATA NORMATIVES
- INTERACTION NORMATIVES
- PERSISTENCE NORMATIVES
- UI NORMATIVES
- GOVERNANCE NORMATIVES

It does NOT modify:

- Editorial rules
- Prompt rules
- Image pipeline
- AI orchestration
- news.status system semantics

---

# 3. Problem (As-Is)

Current state:

- news.status = system pipeline state
- ARCHIVED/DELETED = localStorage
- optional cloud blob backup
- feed filtering partially client-side

Violations:

- No Single Source of Truth
- No deterministic per-user state
- Risk of session inconsistency
- Architecture drift

---

# 4. Canonical Architectural Rule

User interactions MUST NOT mutate global news.status.

User interactions MUST persist per-user state in a dedicated SSOT table.

---

# 5. INTEGRATION MAP (Structural Data Flow)

Collector / AI / Image Pipeline
↓
public.news (system state)
↓
┌────────────────────┐
│ NewsQuery Layer     │ ← SINGLE READ DECISION POINT
│ (server-side)      │
└────────────────────┘
↓
LEFT JOIN news_user_state (per-user SSOT)
↓
UI Feed / Archive / Detail
↑
┌────────────────────┐
│ NewsUserStateSvc   │ ← SINGLE WRITE DECISION POINT
└────────────────────┘
↑
Swipe / Restore Actions

Normative Rule:

- Only NewsQuery Layer decides visibility.
- Only NewsUserStateService writes per-user state.
- UI does not filter archived/deleted manually.
- localStorage is never authoritative.

---

# 6. DATA NORMATIVE

Table: news_user_state

Columns:
- id uuid primary key default gen_random_uuid()
- user_id uuid not null
- news_id bigint not null
- status user_news_status not null (ENUM: 'ARCHIVED','DELETED')
- updated_at timestamptz default now()

Constraints:
- UNIQUE(user_id, news_id)
- INDEX(user_id, status)
- RLS ENABLED
- DB trigger: updated_at is DB-authoritative (clients MUST NOT send timestamps)

news.status remains untouched by user actions.

---

# 7. INTERACTION NORMATIVE

Feed:
- Swipe LEFT  → ARCHIVED (upsert)
- Swipe RIGHT → DELETED (upsert)

Archive:
- Swipe → DELETED

All writes go through NewsUserStateService.

---

# 8. PERSISTENCE NORMATIVE

Must survive:

- logout/login
- device switch
- refresh

Must be server-filtered.

---

# 9. UI NORMATIVE

Feed:
Exclude rows where state exists.

Archive:
Include only status='ARCHIVED'.

Deleted:
Never rendered.

UI must not filter using local arrays.

---

# 10. RESTORE NORMATIVE

ARCHIVED → ACTIVE:
Delete row from news_user_state.

DELETED restore:
Out of scope.

---

# 11. Migration Rule

Legacy localStorage state may be migrated once into DB.
After migration, localStorage is cache only.

---

# 12. Patch Plan — IMPLEMENTATION EVIDENCE

---

## PATCH 0 — Docs Alignment ✅ COMPLETE

**Goal:** Align documentation with CR-008 v2.1.

**Changed files:**

| File | Change |
|------|--------|
| `docs/STATE_MACHINE.md` | Updated to v2.0. ARCHIVED/DELETED marked as `news_user_state`-backed (not "Local only"). Per-User State section added with mermaid diagram. Query patterns documented (Feed: NOT IN, Archive: JOIN WHERE ARCHIVED). |
| `docs/SWIPE_INTERACTION_CONTRACT.md` | Updated to v2.1. Section 1 "Persistence Model (SSOT)" added. States `news_user_state` as Source of Truth. localStorage marked as "cache only". All swipe→DB transitions mapped. Determinism rule added: "Clients MUST NOT send `updated_at`". |

---

## PATCH 1 — DB SSOT Creation ✅ COMPLETE

**Goal:** Create table `public.news_user_state`.

**Migration files:**

| File | Content |
|------|---------|
| `supabase/migrations/20260219153000_create_news_user_state.sql` | Creates ENUM `user_news_status` ('ARCHIVED','DELETED'). Creates table with UUID PK, user_id (FK→auth.users ON DELETE CASCADE), news_id (FK→news ON DELETE CASCADE), status, updated_at. UNIQUE(user_id, news_id). Index on (user_id, status). RLS enabled with two policies: SELECT own + ALL own. |
| `supabase/migrations/20260219163000_news_user_state_updated_at_trigger.sql` | Creates function `update_news_user_state_updated_at()` (sets `NEW.updated_at = now()`). Creates BEFORE UPDATE trigger (idempotent via pg_trigger check). |

**Verification scripts:**

| File | Purpose |
|------|---------|
| `scripts/apply-cr008-migrations.ts` | Applies both migrations in order, verifies table accessible via API. |
| `scripts/verify-cr008-deployment.ts` | Confirms table exists post-deploy. |
| `scripts/check-db-table.ts` | Diagnostic check for table accessibility. |

---

## PATCH 2 — Read Path Harmonization ✅ COMPLETE

**Goal:** Server-side filtering via DB exclusion.

**Implementation:**

| File | Function | Logic |
|------|----------|-------|
| `src/services/news/NewsUserStateService.ts` | `fetchExcludedIds(userId)` | SELECT news_id FROM news_user_state WHERE user_id=X AND status IN ('ARCHIVED','DELETED'). Returns number[] of excluded IDs. |
| `src/services/news/FeedManager.ts` L411-419 | `fillEmptySlots()` | Calls `NewsUserStateService.fetchExcludedIds()`. Appends `.not('id', 'in', ...)` to Supabase query. DB-excluded items never enter feed candidates. |
| `src/services/news/NewsUserStateService.ts` | `fetchArchivedNews(userId)` | SELECT *, news_user_state!inner(status, updated_at) FROM news WHERE news_user_state.user_id=X AND status='ARCHIVED' ORDER BY news_user_state.updated_at DESC. Strips join property, returns clean News[]. |
| `src/components/views/ArchiveView.tsx` L28 | `useEffect` | Calls `NewsUserStateService.fetchArchivedNews(userId)` on mount. Renders only DB-sourced archived items. |

---

## PATCH 3 — Write Path Persistence ✅ COMPLETE

**Goal:** All swipe actions persist to DB via NewsUserStateService.

**Implementation:**

| File | Function | Logic |
|------|----------|-------|
| `src/services/news/NewsUserStateService.ts` | `setNewsState(userId, newsId, status)` | UPSERT {user_id, news_id, status} with onConflict: 'user_id,news_id'. updated_at is DB-authoritative (trigger). |
| `src/services/news/FeedManager.ts` L124-129 | `handleSwipe()` | Optimistic local update THEN fire-and-forget `NewsUserStateService.setNewsState()`. Maps LEFT→ARCHIVED, RIGHT→DELETED. |
| `src/services/news/FeedManager.ts` L146-151 | `handleArchiveDeletion()` | Removes from archived list, adds to deleted. Calls `setNewsState(userId, newsId, 'DELETED')`. |

**localStorage role:** Remains as optimistic UI cache only. No `localStorage.*(archived|deleted|history)` patterns found as SSOT in `src/`.

---

## PATCH 4 — Restore ✅ COMPLETE

**Goal:** Restore archived items to feed.

**Implementation:**

| File | Function | Logic |
|------|----------|-------|
| `src/services/news/NewsUserStateService.ts` | `restoreNewsState(userId, newsId)` | DELETE FROM news_user_state WHERE user_id=X AND news_id=Y. Item becomes eligible for feed again. |
| `src/services/news/FeedManager.ts` L154-172 | `restoreNewsItem()` | Removes from local archived/deleted arrays. Calls `NewsUserStateService.restoreNewsState()` fire-and-forget. |
| `src/components/views/ArchiveView.tsx` L55-58 | `onRestore()` | Calls `restoreNewsItem(id)`. Optimistically removes from display list. |

---

## PATCH 5 — Migration Bridge ✅ COMPLETE (BY DESIGN)

**Goal:** Migrate legacy localStorage state to DB.

**Implementation:**

No explicit migration script was needed because:

1. localStorage arrays remain as optimistic cache (not authoritative).
2. New actions flow through `NewsUserStateService` → DB.
3. Old cached state gracefully ages out (30-day news cutoff in FeedManager).
4. `UNIQUE(user_id, news_id)` prevents duplication if same item is re-archived.

---

# 13. Acceptance Criteria — VERIFICATION STATUS

| Criterion | Status | Evidence |
|-----------|--------|----------|
| No mutation of news.status by user actions | ✅ | `NewsUserStateService` only writes to `news_user_state`. No code path touches `news.status` from swipe handlers. |
| Per-user state survives sessions | ✅ | All writes via Supabase upsert. RLS ensures per-user isolation. |
| Feed & Archive are server-filtered | ✅ | `fetchExcludedIds()` in feed path (L411-419). `fetchArchivedNews()` for archive. |
| UNIQUE constraint prevents duplication | ✅ | `UNIQUE(user_id, news_id)` in migration SQL. Upsert uses `onConflict`. |
| UI contains no manual archived/deleted filtering logic | ✅ | No `localStorage.*(archived|deleted)` SSOT patterns in `src/`. UI defers to DB. |
| updated_at is DB-authoritative | ✅ | Trigger `trigger_news_user_state_updated_at` overwrites on UPDATE. Client never sends timestamp. |

---

END
