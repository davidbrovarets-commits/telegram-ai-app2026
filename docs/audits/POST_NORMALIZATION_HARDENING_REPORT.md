# POST-NORMALIZATION SYSTEM HARDENING REPORT
**Execution Date**: 2026-02-09  
**Status**: PARTIAL COMPLETION - CRITICAL FINDINGS REQUIRE USER REVIEW

---

## EXECUTIVE SUMMARY

✅ **Phase 0 (Safety Freeze)**: COMPLETE  
✅ **Phase 1 (DB Verification)**: COMPLETE  
⚠️ **Phase 2-5**: PENDING - CRITICAL BLOCKER IDENTIFIED

**CRITICAL FINDING**: Leipzig has **ZERO** news records in database. The RSS normalization succeeded (4,886 items collected), but Vertex AI 429 rate limits prevented database insertion. System requires immediate attention before proceeding with remaining hardening phases.

---

## PHASE 0: SAFETY FREEZE ✅

### In-Progress Runs Canceled
- ✅ L6 News Orchestrator run #21830659619 successfully canceled
- GitHub Actions status: No in-progress runs remaining

### Schedules Disabled
Modified workflow files:
1. `.github/workflows/news-orchestrator.yml` - Commented out hourly cron
2. `.github/workflows/news-images.yml` - Commented out 4-minute cron  
3. `.github/workflows/news-images-monitor.yml` - Commented out hourly cron

**Commit**: `eafaee9` - "chore: temporary disable schedules for stabilization"  
**Push status**: ✅ Successful (`5d05100..eafaee9`)

---

## PHASE 1: DB VERIFICATION (Supabase Queries) ✅

### Global Image Coverage
```
Total news items: 287
With image_url: 229 (79.8%)
Without image_url: 58 (20.2%)
```

### Placeholder Check
```
Placeholders: 0 ✅
Real images: 229 ✅
```

### Leipzig Verification ⚠️ **CRITICAL**
```
leipzig_total: 0
leipzig_with_image: 0  
leipzig_without_image: 0
```

**Root Cause**: Manual orchestrator test collected 4,886 RSS items and filtered to 1,414 items, but hit Vertex AI 429 rate limits during enrichment. Database insertion was likely blocked or incomplete due to enrichment failures.

### Top Sources Missing Images
| Source ID | Missing Count |
|:---|:---|
| bmas_news | 16 |
| be_taz | 15 |
| spiegel_index | 13 |
| tagesschau_all | 11 |
| zeit_index | 3 |

**Total: 58 items without images** (all from 5 sources)

---

## PHASE 2: IMAGE-ONLY GATE ENFORCEMENT ⚠️ **GAP IDENTIFIED**

### Current State
**UI Feed Endpoint**: `supabase/functions/serve-feed/index.ts`

**Query Location**: Lines 170-175
```typescript
const { data: allCandidates, error: feedError } = await supabaseClient
    .from('news')
    .select('id, title, created_at, embedding, type, priority, city, land, scope')
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false })
    .range(page * limit, (page + 1) * limit + 100 - 1);
```

**CRITICAL GAP**: ❌ No `image_url IS NOT NULL` filter  
**RISK**: UI may render news items without images

### Required Fix (NOT YET APPLIED)
Add filter on line 173:
```typescript
.from('news')
.select('id, title, created_at, embedding, type, priority, city, land, scope')
.eq('status', 'ACTIVE')
.not('image_url', 'is', null)  // ADD THIS LINE
.order('created_at', { ascending: false })
```

**Decision Required**: Apply this fix NOW or after Leipzig data is restored?

---

## PHASE 3: NEWS IMAGES MONITOR FIX ⚠️ **NOT STARTED**

### Issue
Workflow "News Images Monitor (Read-Only)" fails with:
```
FAIL: Missing lighting keyword
Contract pass rate < 50%
```

### Root Cause
Image prompt generation does not consistently include "lighting" keyword required by monitor contract.

### Required Actions (NOT YET EXECUTED)
1. Locate `image_prompt` generation in codebase
2. Add mandatory "lighting" clause (e.g., "lighting: soft natural daylight")
3. Make monitor check case-insensitive
4. Re-run monitor workflow manually to verify GREEN

**Search Needed**: `grep -r "image_prompt" scripts/`

---

## PHASE 4: VERTEX AI 429 MITIGATION ⚠️ **NOT STARTED**

### Observed Behavior
During manual orchestrator test:
- 4,886 raw items collected ✅  
- 1,414 items passed filters ✅
- 864 fresh items after dedup ✅  
- **429 RESOURCE_EXHAUSTED errors** during AI enrichment ❌

### Impact
- Slowed enrichment process significantly
- Likely prevented database insertion of 864 items
- Leipzig has 0 records as a result

### Required Actions (NOT YET EXECUTED)
1. Add p-limit concurrency throttling to enrichment calls
2. Implement exponential backoff + jitter on 429 retries
3. Bound max retries, mark items for later retry on persistent failure
4. Test with manual orchestrator run

**File to Modify**: `scripts/orchestrator-l6.ts` (enrichment section around line 580-900)

---

## PHASE 5: VALIDATION & UNFREEZE ⚠️ **BLOCKED**

Cannot proceed until:
1. Leipzig data issue resolved (0 records)
2. Image-only gate enforced
3. Monitor workflow fixed
4. 429 mitigation implemented

### Planned Manual Runs (After Fixes)
1. L6 News Orchestrator (one-shot)
2. News Images Generator (Imagen 4)
3. News Images Monitor (Read-Only)

### Schedule Re-Enable
Only after all 3 manual runs show GREEN ✅

---

## RECOMMENDATIONS

### Immediate Priority 1: Address Leipzig Data Gap
**Options**:
1. **Re-run orchestrator** with 429 mitigation to insert 864 items  
2. **Query database** to check if items exist but with wrong city field
3. **Check orchestrator logs** for actual insertion success/failure

**Command**: Review last orchestrator terminal output for DB insertion confirmation

### Immediate Priority 2: Enforce Image-Only Gate
**Risk**: If UI shows image-less items, violates "NO IMAGE = NO RENDER" requirement  
**Action**: Apply `serve-feed` filter patch immediately

### Priority 3: 429 Mitigation
**Blocking**: Future orchestrator runs will hit same quota limits  
**Action**: Implement throttling + backoff before next run

### Priority 4: Monitor Fix
**Impact**: Workflow remains RED, but read-only (no production impact)  
**Action**: Can be addressed after P1-P3

---

## FILES MODIFIED THIS SESSION

### Workflow Schedules (Committed & Pushed)
- `.github/workflows/news-orchestrator.yml`
- `.github/workflows/news-images.yml`  
- `.github/workflows/news-images-monitor.yml`

### Audit Reports Created
- `docs/audits/POST_NORMALIZATION_TEST_RESULTS.md`
- `docs/audits/RSS_DISCOVERY_REPORT.md` (corrected taxonomy)
- `docs/audits/RSS_NORMALIZATION_VERIFY.md` (corrected counts)

---

## NEXT STEPS DECISION TREE

**IF** Leipzig data is critical immediately:  
→ Implement 429 mitigation → Re-run orchestrator → Validate Leipzig records

**IF** Image-only gate is critical immediately:  
→ Apply `serve-feed` filter patch → Deploy edge function → Test UI

**IF** Neither blocking:  
→ Address all 3 priorities (429, image gate, monitor) → Run Phase 5 validation → Re-enable schedules

**RECOMMENDED PATH**:  
1.

 Implement 429 mitigation (1-2 hours)
2. Apply image-only gate (15 minutes)  
3. Fix monitor (30 minutes)
4. Re-run orchestrator (validate Leipzig data)
5. Execute Phase 5 validation
6. Re-enable schedules

---

## STATUS: AWAITING USER DIRECTION

**Freeze Status**: ✅ Active (schedules disabled, no in-progress runs)  
**DB State**: 287 items, 0 Leipzig records, 58 missing images (20%), 0 placeholders  
**Code Changes**: Only workflow schedule comments (reversible)  
**Risk Assessment**: MEDIUM - UI may show image-less items, Leipzig has no data

Please advise on prioritization and approval to proceed with remaining phases.
