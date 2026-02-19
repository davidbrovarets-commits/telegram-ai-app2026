# News Text Limits Audit

> Generated: 2026-02-19 | Read-only audit — no production behavior changed

## Executive Summary

News text length limits exist in **5 layers**, defined in **8 files**. Key finding: **generation-time constraints are character-based** (Zod schema), the **prompt also specifies word counts** (250–290 words for uk_content), and the **UI truncation layer uses word counts** (7 words for titles, 200 for summaries). These two unit systems (chars vs words) create a gap — neither the schema nor the UI enforce the other's unit.

> [!WARNING]
> The prompt requests 250–290 **words** for `uk_content`, but the Zod schema only enforces ≤4000 **characters**. There is no runtime word-count enforcement.

---

## Inventory by Layer

### GENERATION — AI Prompt (`scripts/orchestrator-l6.ts`)

| Field | Limit | Unit | Enforcement | File:Line |
|-------|-------|------|-------------|-----------|
| `de_summary` | max 600 | chars | prompt hint | [orchestrator-l6.ts:L290](file:///c:/Projektid/telegram-ai-app/scripts/orchestrator-l6.ts#L290) |
| `uk_summary` | max 1200 | chars | prompt hint | [orchestrator-l6.ts:L291](file:///c:/Projektid/telegram-ai-app/scripts/orchestrator-l6.ts#L291) |
| `uk_content` | 250–290 words, max 4000 chars | words + chars | prompt hint (not enforced at runtime) | [orchestrator-l6.ts:L292](file:///c:/Projektid/telegram-ai-app/scripts/orchestrator-l6.ts#L292) |
| `uk_title` | max 180 | chars | prompt hint | [orchestrator-l6.ts:L293](file:///c:/Projektid/telegram-ai-app/scripts/orchestrator-l6.ts#L293) |
| `action_hint` | max 120 | chars | prompt hint | [orchestrator-l6.ts:L294](file:///c:/Projektid/telegram-ai-app/scripts/orchestrator-l6.ts#L294) |
| `actions` | max 3 tags | count | prompt hint | [orchestrator-l6.ts:L295](file:///c:/Projektid/telegram-ai-app/scripts/orchestrator-l6.ts#L295) |
| Input text | configurable | tokens | hard truncate | [limits.ts:L13](file:///c:/Projektid/telegram-ai-app/scripts/lib/limits.ts#L13) (MAX_TOKENS_PER_ARTICLE=900) |
| Input sanitize | configurable `maxLen` | chars | hard truncate | [prompt-sanitize.ts:L34](file:///c:/Projektid/telegram-ai-app/scripts/lib/prompt-sanitize.ts#L34) |

### GENERATION — Zod Schema Validation (`scripts/lib/ai-schemas.ts`)

| Field | Min | Max | Unit | Enforcement | File:Line |
|-------|-----|-----|------|-------------|-----------|
| `de_summary` | — | 600 | chars | **HARD** (reject) | [ai-schemas.ts:L26](file:///c:/Projektid/telegram-ai-app/scripts/lib/ai-schemas.ts#L26) |
| `uk_summary` | 1 | 1200 | chars | **HARD** (reject) | [ai-schemas.ts:L27](file:///c:/Projektid/telegram-ai-app/scripts/lib/ai-schemas.ts#L27) |
| `uk_content` | 1 | 4000 | chars | **HARD** (reject) | [ai-schemas.ts:L28](file:///c:/Projektid/telegram-ai-app/scripts/lib/ai-schemas.ts#L28) |
| `uk_title` | 1 | 180 | chars | **HARD** (reject) | [ai-schemas.ts:L29](file:///c:/Projektid/telegram-ai-app/scripts/lib/ai-schemas.ts#L29) |
| `action_hint` | — | 120 | chars | **HARD** (reject) | [ai-schemas.ts:L30](file:///c:/Projektid/telegram-ai-app/scripts/lib/ai-schemas.ts#L30) |
| `actions` | — | 3 | count | **HARD** (reject) | [ai-schemas.ts:L31](file:///c:/Projektid/telegram-ai-app/scripts/lib/ai-schemas.ts#L31) |

Post-validation trimming in [ai-guards.ts:L18-38](file:///c:/Projektid/telegram-ai-app/scripts/lib/ai-guards.ts#L18-L38).

### STORAGE — Fallback (`scripts/orchestrator-l6.ts`)

| Field | Limit | Unit | Enforcement | File:Line |
|-------|-------|------|-------------|-----------|
| `de_summary` (fallback) | 240 | chars | **SOFT** (slice + '...') | [orchestrator-l6.ts:L337](file:///c:/Projektid/telegram-ai-app/scripts/orchestrator-l6.ts#L337) |

### PUSH NOTIFICATIONS (`scripts/push-templates.ts`)

| Field | Max | Unit | Enforcement | File:Line |
|-------|-----|------|-------------|-----------|
| Push `title` | 60 | chars | **SOFT** (slice) | [push-templates.ts:L59](file:///c:/Projektid/telegram-ai-app/scripts/push-templates.ts#L59) |
| Push `body` | 140 | chars | **SOFT** (slice) | [push-templates.ts:L60](file:///c:/Projektid/telegram-ai-app/scripts/push-templates.ts#L60) |

### UI — List / Feed Card (`src/components/news/NewsCardContentL6.tsx`)

| Field | Limit | Unit | Enforcement | File:Line |
|-------|-------|------|-------------|-----------|
| Title (pre-line) | max 7 | words | **SOFT** (truncate + '...') | [NewsCardContentL6.tsx:L12](file:///c:/Projektid/telegram-ai-app/src/components/news/NewsCardContentL6.tsx#L12) via [newsFormat.ts:L13](file:///c:/Projektid/telegram-ai-app/src/utils/newsFormat.ts#L13) |
| Summary | **none** | — | rendered raw (`uk_summary` or `content`) | [NewsCardContentL6.tsx:L13](file:///c:/Projektid/telegram-ai-app/src/components/news/NewsCardContentL6.tsx#L13) |

### UI — Detail Page (`src/components/views/NewsDetailView.tsx`)

| Field | Limit | Unit | Enforcement | File:Line |
|-------|-------|------|-------------|-----------|
| Title | max 7 | words | **SOFT** (truncate + '...') | [NewsDetailView.tsx:L13](file:///c:/Projektid/telegram-ai-app/src/components/views/NewsDetailView.tsx#L13) via [newsFormat.ts:L13](file:///c:/Projektid/telegram-ai-app/src/utils/newsFormat.ts#L13) |
| Content | **none** | — | rendered raw | [NewsDetailView.tsx:L62](file:///c:/Projektid/telegram-ai-app/src/components/views/NewsDetailView.tsx#L62) |
| Hostname | 15 | chars | **SOFT** (substring + '...') | [NewsDetailView.tsx:L27-28](file:///c:/Projektid/telegram-ai-app/src/components/views/NewsDetailView.tsx#L27-L28) |

### UI — TaskModal (legacy/shared)

| Field | Limit | Unit | Enforcement | File:Line |
|-------|-------|------|-------------|-----------|
| Title | max 7 | words | **SOFT** (truncate + '...') | [TaskModal.tsx:L33](file:///c:/Projektid/telegram-ai-app/src/components/modals/TaskModal.tsx#L33) |
| Summary | max 200 | words | **SOFT** (truncate + '...') | [TaskModal.tsx:L45](file:///c:/Projektid/telegram-ai-app/src/components/modals/TaskModal.tsx#L45) |

### DATABASE (Supabase)

| Column | Type | Constraint |
|--------|------|-----------|
| `title` | `text` | No char limit |
| `content` | `text` | No char limit |
| `uk_summary` | `text` | No char limit |

> No `varchar(N)` constraints found. All news text columns are unbounded `text`.

---

## LIST vs DETAIL Comparison

| Aspect | Feed Card (List) | Detail Page |
|--------|-----------------|-------------|
| **Title source** | `item.title \|\| item.uk_summary \|\| item.content` | `item.title` |
| **Title limit** | 7 words (soft truncate) | 7 words (soft truncate) |
| **Body source** | `item.uk_summary \|\| item.content` | `item.content` |
| **Body limit** | None (rendered raw, CSS overflow:hidden) | None (rendered raw, full scroll) |
| **Image** | 16:9 aspect ratio, fallback placeholder | Full width, fallback placeholder |

---

## Enforcement Matrix

| Field | Prompt Hint | Zod Schema (Hard) | UI Truncation (Soft) | DB Constraint |
|-------|:-----------:|:-----------------:|:--------------------:|:-------------:|
| `uk_title` | ≤180 chars | min 1, max 180 chars | 7 words | none |
| `uk_summary` | ≤1200 chars | min 1, max 1200 chars | none (card) / 200 words (TaskModal) | none |
| `uk_content` | 250–290 words, ≤4000 chars | min 1, max 4000 chars | none | none |
| `de_summary` | ≤600 chars | max 600 chars | — | none |
| `action_hint` | ≤120 chars | max 120 chars | — | none |

---

## Risk Notes

1. **Word vs char mismatch**: Prompt requests 250–290 words for `uk_content` but schema only validates chars (≤4000). If AI generates <250 words, no runtime check catches it.
2. **Title double-truncation**: `uk_title` is capped at 180 chars by schema, then further truncated to 7 words by UI. A 180-char title (≈25 words) will always be cut to 7 words on screen.
3. **No summary truncation on feed card**: `NewsCardContentL6` renders `uk_summary` raw (no `formatSummary200Words` call). Only `TaskModal` uses the 200-word truncation.
4. **Fallback slice is arbitrary**: `fallbackMock` uses `.slice(0, 240)` for de_summary fallback — not aligned with the 600-char schema max.
5. **Push limits are separate**: Push notification title (60 chars) and body (140 chars) are independent from news field limits.

---

## Files Referenced

| File | Role |
|------|------|
| [orchestrator-l6.ts](file:///c:/Projektid/telegram-ai-app/scripts/orchestrator-l6.ts) | AI prompt with field limits |
| [ai-schemas.ts](file:///c:/Projektid/telegram-ai-app/scripts/lib/ai-schemas.ts) | Zod schema (hard enforcement) |
| [ai-guards.ts](file:///c:/Projektid/telegram-ai-app/scripts/lib/ai-guards.ts) | Runtime validation + trim |
| [limits.ts](file:///c:/Projektid/telegram-ai-app/scripts/lib/limits.ts) | Token/article caps |
| [prompt-sanitize.ts](file:///c:/Projektid/telegram-ai-app/scripts/lib/prompt-sanitize.ts) | Input sanitization + truncation |
| [newsFormat.ts](file:///c:/Projektid/telegram-ai-app/src/utils/newsFormat.ts) | UI truncation functions |
| [NewsCardContentL6.tsx](file:///c:/Projektid/telegram-ai-app/src/components/news/NewsCardContentL6.tsx) | Feed card rendering |
| [NewsDetailView.tsx](file:///c:/Projektid/telegram-ai-app/src/components/views/NewsDetailView.tsx) | Detail page rendering |
| [push-templates.ts](file:///c:/Projektid/telegram-ai-app/scripts/push-templates.ts) | Push notification limits |
| [TaskModal.tsx](file:///c:/Projektid/telegram-ai-app/src/components/modals/TaskModal.tsx) | Modal rendering (uses both formatters) |
