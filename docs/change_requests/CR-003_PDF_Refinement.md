# CHANGE REQUEST: CR-003 (PDF Layout & Content Refinement)

────────────────────────────────
## 1. Change Goal
Refine the document analysis PDF output to meet strict styling and content requirements:
1.  **Layout**: Ensure consistent header/footer margins on all pages (prevent text hugging the edge).
2.  **Content**:
    *   Add "Analysis Date" (top right).
    *   Remove conversational fillers (e.g., "Sure, here is...").
    *   Standardize Title format: "Dokument [Organization]".

────────────────────────────────
## 2. Change Classification
**Classification: CORE**
Reason: Modifies Core user-facing output (`FileModal.tsx`) and Core AI prompt (`api.ts`).

────────────────────────────────
## 3. Explicit Boundaries
**IN SCOPE:**
- `FileModal.tsx`: Visual layout (margins, date display).
- `api.ts`: LLM Prompt tuning for strict formatting.

**OUT OF SCOPE:**
- Changing the underlying PDF library.

────────────────────────────────
## 4. Acceptance Criteria
1.  **Date**: Analysis date appears in the top-right corner of the PDF.
2.  **Clean Start**: The text starts immediately with the Title (no "Sure...").
3.  **Title Format**: Title follows "Dokument [Organization]" pattern.
4.  **Pagination**: Text on Page 2+ starts with a visible top margin, matching the side margin.

────────────────────────────────
## 5. Rollback Plan
1.  Revert `api.ts` prompt change.
2.  Revert `FileModal.tsx` layout logic.

────────────────────────────────
## 6. Governance Acknowledgement
"Pre-Action Governance Check: OK"

────────────────────────────────
## 7. Owner
User (via Request Step 562)
