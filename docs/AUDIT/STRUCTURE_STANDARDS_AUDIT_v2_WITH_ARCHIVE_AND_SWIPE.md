# STRUCTURAL STANDARDS AUDIT v2 — With Archive & Swipe State

**Generated:** 2026-02-19T15:01:00+01:00  
**Scope:** Read-only audit — no code, DB, or config changes made.  
**Branch:** `chore/cr-007-word-based-normalization` (working branch)

---

## 1️⃣ EXECUTIVE SUMMARY

| Domain | Governed? | Status |
|--------|-----------|--------|
| **Text Standards** | ✅ YES | CR-007 SSOT in `src/config/newsTextRules.ts` |
| **UI Layout (Feed)** | ⚠️ PARTIAL | `UI_NEWS_CARD_CONTRACT_L6.md` exists but isn't SSOT-linked |
| **UI Layout (Detail)** | ⚠️ PARTIAL | No contract doc; renders raw content |
| **UI Layout (Archive)** | ❌ NO | No contract; reuses feed card without spec |
| **Swipe Behavior** | ❌ NO | Implemented but undocumented |
| **State Machine** | ❌ NO | 7 states in TS type but no state machine document |
| **DB State Model** | ⚠️ PARTIAL | `status` column exists but swipe never writes to it |
| **Image Policy** | ⚠️ PARTIAL | `IMAGE_PIPELINE_L6.md` + `imagen_prompt_guide.md` exist |
| **Prompt/Model Policy** | ✅ YES | `EXECUTION_GOVERNANCE.md` + SSOT prompt |
| **Ops Governance** | ✅ YES | `EXECUTION_GOVERNANCE.md` + mutation-guard.ts |

### Overall Verdict: **PARTIAL** — 3/10 domains fully governed.

### Top 7 Structural Risks

| # | Risk | Severity |
|---|------|----------|
| 1 | **Archive/delete state is LOCAL ONLY** — never written to DB `status` column | 🔴 CRITICAL |
| 2 | **No state machine document** — 7 states defined in type, no transition rules | 🔴 CRITICAL |
| 3 | **Swipe directions undocumented** — RIGHT=archive, LEFT=delete (non-obvious) | 🟡 HIGH |
| 4 | **No undo/restore capability** — archived→deleted is one-way, no restore | 🟡 HIGH |
| 5 | **Archive view has no spec** — reuses NewsCard but unlisted in any contract | 🟡 HIGH |
| 6 | **DB status column is orphaned** — `news.status` never set to ARCHIVED/DELETED by client | 🟡 HIGH |
| 7 | **localStorage is the only truth** — clearing browser data loses archive permanently | 🟠 MEDIUM |

---

## 2️⃣ CURRENT SYSTEM MAP (AS-IS)

### Text Standards

| Rule | Source | Enforcement |
|------|--------|-------------|
| Title: 7–10 words, full sentence | `src/config/newsTextRules.ts` L7-11 | Hard (ai-guards.ts) |
| Summary: 30–45 words | `src/config/newsTextRules.ts` L12-15 | Hard (ai-guards.ts) |
| Content: 300–400 words | `src/config/newsTextRules.ts` L16-19 | Hard (ai-guards.ts) |
| Schema safety caps | `scripts/lib/ai-schemas.ts` L25-31 | Hard (Zod) |

**Status:** ✅ Fully governed via SSOT (CR-007).

---

### UI Layout — Feed

| Component | File | Notes |
|-----------|------|-------|
| Card wrapper | `src/components/news/NewsCard.tsx` | Wraps SwipeableNewsCard + NewsCardContentL6 |
| Card content | `src/components/news/NewsCardContentL6.tsx` | Renders title + summary raw (post CR-007) |
| Swipe shell | `src/components/views/SwipeableNewsCard.tsx` | Framer-motion drag on X axis |

**Contract doc:** `docs/UI_NEWS_CARD_CONTRACT_L6.md` — exists but not updated for CR-007.

---

### UI Layout — Detail

| Component | File | Notes |
|-----------|------|-------|
| Detail view | `src/components/views/NewsDetailView.tsx` | Renders title + content raw |
| Modal (shared) | `src/components/modals/TaskModal.tsx` | Renders title + summary raw |

**Contract doc:** ❌ None.

---

### UI Layout — Archive

| Component | File | Notes |
|-----------|------|-------|
| Archive view | `src/components/views/ArchiveView.tsx` L1-134 | Full-page view, reuses `NewsCard` |
| Card variant | `NewsCard.tsx` L12 `variant='archive'` | Same content layout as feed |
| Header | ArchiveView L104 | "АРХІВ НОВИН" gray header |
| Empty state | ArchiveView L110-112 | "Архів порожній" |

**Key behaviors:**
- Archive fetches items by ID from Supabase (`news` table, no status filter)
- Uses `NewsCard` with `variant='archive'` and `mode='archive'`
- In archive mode: swipe LEFT = delete (permanent), no swipe RIGHT action
- Items displayed in reverse chronological order of archival

**Contract doc:** ❌ None. Completely undocumented.

---

### Swipe Behavior

**Implementation:** `SwipeableNewsCard.tsx` using Framer Motion `drag="x"`

| Context | Swipe Direction | Offset Threshold | Action | Color |
|---------|----------------|-------------------|--------|-------|
| **Feed** | RIGHT (→) | 60px | DELETE | Red `#FF3B30` |
| **Feed** | LEFT (←) | 60px | ARCHIVE | Gray `#8E8E93` |
| **Archive** | LEFT (←) | 60px | DELETE | Red `#FF3B30` |
| **Archive** | RIGHT (→) | 60px | DELETE | Red `#FF3B30` |

**Evidence:**
- `SwipeableNewsCard.tsx` L54: `threshold = 60`
- `SwipeableNewsCard.tsx` L59: RIGHT → `onDelete()`
- `SwipeableNewsCard.tsx` L66-73: LEFT → if `mode='archive'` then `onDelete()`, else `onArchive()`
- `FeedManager.ts` L100: `direction === 'RIGHT' ? 'ARCHIVE' : 'DELETE'`

> [!WARNING]
> **Inversion detected:** `SwipeableNewsCard.tsx` maps RIGHT→delete, LEFT→archive, but `FeedManager.handleSwipe()` maps RIGHT→ARCHIVE, LEFT→DELETE. The `NewsView.tsx` wires them correctly (L138-139) but the naming is confusing and fragile.

**Contract doc:** ❌ None.

---

### DB State Model

**Table:** `news`  
**Column:** `status` (type: text, no constraint)  
**Type definition:** `src/types/index.ts` L17

```typescript
export type NewsStatus = 'ACTIVE' | 'ARCHIVED' | 'DELETED' | 'AUTO_REMOVED' | 'POOL' | 'SHADOW_DELETED' | 'AUTO_EXPIRED';
```

**State storage:**

| Layer | Storage | Persistence | Synced? |
|-------|---------|-------------|---------|
| Client archive/delete | `localStorage` key `telegram-app-news-state-v7` | Per-browser | Yes → `user_news_states` table |
| DB `news.status` | Supabase `news` table | Permanent | ❌ Never written by swipe |

**What happens on swipe (FeedManager.handleSwipe L94-121):**
1. Moves `newsId` to `history.archived[]` or `history.deleted[]` in localStorage
2. Removes from `visibleFeed` (replaces with `-1`)
3. Calls `fillEmptySlots()` to pull new items
4. Syncs entire state to `user_news_states` table via cloud sync
5. **Does NOT update `news.status` in DB** — the DB row remains unchanged

**What happens on archive deletion (FeedManager.handleArchiveDeletion L123-136):**
1. Removes from `history.archived[]`
2. Adds to `history.deleted[]`
3. **Does NOT update DB**

**Contract doc:** ❌ None.

---

### Image Policy

| Document | Path | Current? |
|----------|------|----------|
| Image pipeline | `docs/IMAGE_PIPELINE_L6.md` | ⚠️ Pre-CR-007 |
| Imagen prompt guide | `docs/imagen_prompt_guide.md` | ✅ Active |
| Banner system | `docs/news-banner-system.md` | ✅ Active |

**Feed vs Archive vs Detail image behavior:**
- Feed: shows `image_url` via `NewsCardContentL6.tsx` with `aspect-ratio: 16/9`
- Archive: same card → same image rendering
- Detail: shows `image_url` via `NewsDetailView.tsx` with same aspect ratio
- **Unified:** ✅ All three views use the same image source and aspect ratio.

---

### Prompt/Model Policy

- `docs/EXECUTION_GOVERNANCE.md` — model selection, DRY_RUN enforcement
- `src/config/newsTextRules.ts` — word limits used in prompt (CR-007)
- `scripts/orchestrator-l6.ts` L280-300 — prompt text using SSOT values

**Status:** ✅ Governed.

---

### Ops Governance

- `docs/EXECUTION_GOVERNANCE.md` — schedules, mutation guards
- `scripts/lib/mutation-guard.ts` — runtime enforcement
- `docs/incident_sop.md` — incident procedures

**Status:** ✅ Governed.

---

## 3️⃣ STATE TRANSITION DIAGRAM

### Defined States (from TypeScript type, L17)

```
POOL → ACTIVE → (user swipe) → [local only: archived / deleted]

DB-side states (set by orchestrator/auto-healer):
  POOL          — ingested, awaiting image
  ACTIVE        — published to feed
  AUTO_REMOVED  — removed by auto-healer
  SHADOW_DELETED — soft-deleted server-side
  AUTO_EXPIRED  — expired by TTL logic
  ARCHIVED      — defined but NEVER SET by any code path
  DELETED       — defined but NEVER SET by any code path
```

### Actual Transitions (as implemented)

```
                    ┌─────────────────────────────┐
                    │     ORCHESTRATOR              │
                    │  (scripts/orchestrator-l6.ts) │
                    └──────────┬──────────────────┘
                               │ insert with status='POOL'
                               ▼
                    ┌──────────────────┐
                    │     POOL         │ (DB)
                    └──────┬───────────┘
                           │ image generated → status='ACTIVE'
                           ▼
                    ┌──────────────────┐
                    │     ACTIVE       │ (DB)
                    └──────┬───────────┘
                           │ fetched by FeedManager
                           ▼
              ┌────────────────────────────┐
              │   CLIENT visibleFeed[]     │ (localStorage)
              └──────┬──────────┬──────────┘
         swipe RIGHT │          │ swipe LEFT
                     ▼          ▼
        ┌────────────────┐  ┌──────────────┐
        │  history.       │  │ history.     │
        │  archived[]     │  │ deleted[]    │  (localStorage)
        └───────┬────────┘  └──────────────┘
                │ swipe LEFT in archive view
                ▼
        ┌──────────────┐
        │ history.     │
        │ deleted[]    │  (localStorage, permanent)
        └──────────────┘

    ⚠️ DB `news.status` stays 'ACTIVE' throughout all client-side transitions.
    ⚠️ No path exists from deleted → restored.
```

---

## 4️⃣ EVIDENCE TABLE

| ID | Domain | Rule/Behavior | File | Lines | Enforcement |
|----|--------|---------------|------|-------|-------------|
| T1 | Text | Title 7–10 words | `src/config/newsTextRules.ts` | L8-9 | Hard |
| T2 | Text | Summary 30–45 words | `src/config/newsTextRules.ts` | L13-14 | Hard |
| T3 | Text | Content 300–400 words | `src/config/newsTextRules.ts` | L17-18 | Hard |
| S1 | Schema | uk_title max 300 chars (safety) | `scripts/lib/ai-schemas.ts` | L29 | Hard |
| S2 | Schema | uk_summary max 2000 chars | `scripts/lib/ai-schemas.ts` | L27 | Hard |
| S3 | Schema | uk_content max 8000 chars | `scripts/lib/ai-schemas.ts` | L28 | Hard |
| U1 | UI-Feed | Card renders raw title | `NewsCardContentL6.tsx` | L11 | Render |
| U2 | UI-Detail | Detail renders raw title | `NewsDetailView.tsx` | L11 | Render |
| U3 | UI-Archive | Archive reuses NewsCard | `ArchiveView.tsx` | L120-127 | Render |
| SW1 | Swipe | RIGHT=archive in feed | `NewsView.tsx` | L138-139 | Client |
| SW2 | Swipe | LEFT=delete in feed | `NewsView.tsx` | L138-139 | Client |
| SW3 | Swipe | Threshold 60px | `SwipeableNewsCard.tsx` | L54 | Client |
| SW4 | Swipe | Archive mode LEFT=delete | `SwipeableNewsCard.tsx` | L70-71 | Client |
| ST1 | State | archived[] in localStorage | `newsStore.ts` | L12 | Local+Cloud |
| ST2 | State | deleted[] in localStorage | `newsStore.ts` | L13 | Local+Cloud |
| ST3 | State | Cloud sync to user_news_states | `newsStore.ts` | L73-90 | Cloud |
| ST4 | State | DB status NEVER updated by swipe | `FeedManager.ts` | L94-121 | **Undocumented** |
| DB1 | DB | NewsStatus has 7 values | `types/index.ts` | L17 | Type-only |
| DB2 | DB | status column is text, no constraint | Supabase schema | N/A | **None** |
| IMG1 | Image | Feed/archive/detail same source | `NewsCardContentL6.tsx` / `NewsDetailView.tsx` | Various | Render |

---

## 5️⃣ GAP ANALYSIS

### Missing Documents

| Document Needed | Current State | Priority |
|----------------|---------------|----------|
| **State Machine Governance** | ❌ Does not exist | 🔴 P0 |
| **Swipe Interaction Contract** | ❌ Does not exist | 🔴 P0 |
| **Archive View UI Contract** | ❌ Does not exist | 🟡 P1 |
| **Detail View UI Contract** | ❌ Does not exist | 🟡 P1 |
| **Feed Card UI Contract** (update) | ⚠️ Exists but stale | 🟡 P1 |

### Missing Logic

| Gap | Risk | Impact |
|-----|------|--------|
| Swipe archive/delete never writes to `news.status` | Data loss on browser clear | 🔴 CRITICAL |
| No undo/restore from deleted state | User error is permanent | 🟡 HIGH |
| `ARCHIVED`/`DELETED` DB statuses defined but never used | Schema drift | 🟠 MEDIUM |
| Archive view fetches from DB without status filter | Could show server-deleted items | 🟠 MEDIUM |
| Cloud sync stores entire state blob, not individual actions | Race conditions possible | 🟠 MEDIUM |

---

## 6️⃣ CORRECTION ROADMAP (No Code Yet)

### Phase 1 — Document What Exists

| # | Action | Output |
|---|--------|--------|
| 1 | Write `docs/STATE_MACHINE.md` | Formal states + transitions + who sets what |
| 2 | Write `docs/SWIPE_INTERACTION_CONTRACT.md` | Directions, thresholds, visual feedback, mode behavior |
| 3 | Write `docs/UI_ARCHIVE_CONTRACT.md` | Archive view spec: layout, card reuse, empty state |
| 4 | Update `docs/UI_NEWS_CARD_CONTRACT_L6.md` | Link to SSOT, remove old char references |

### Phase 2 — Harmonize State

| # | Action | Rationale |
|---|--------|-----------|
| 5 | Write `news.status` on swipe (CR-008) | Make DB reflect user actions |
| 6 | Add archive filter to feed query | Only fetch `status IN ('POOL','ACTIVE')` |
| 7 | Add restore-from-archive capability | Allow undo within archive view |
| 8 | Deprecate unused `NewsStatus` values or implement them | Eliminate type drift |

### Phase 3 — Unify Contracts

| # | Action | Rationale |
|---|--------|-----------|
| 9 | Create `docs/NEWS_GOVERNANCE_INDEX.md` | Master index linking all sub-docs |
| 10 | Add governance check to CI | Lint for SSOT drift on PR |

---

*END OF AUDIT — Read-only. No changes made.*
