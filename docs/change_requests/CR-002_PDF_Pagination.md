# CHANGE REQUEST: CR-002 (PDF Pagination & A4 Formatting)

────────────────────────────────
## 1. Change Goal
Fix the PDF generation functionality in `FileModal.tsx` to correctly handle content that exceeds a single page.
Currently, long analysis results are resized to fit or cut off (clipped) on one page. The goal is to enforce standard A4 formatting with proper pagination.

────────────────────────────────
## 2. Change Classification
**Classification: CORE**
Reason: Changes a user-facing export function (`FileModal.tsx`).
Risk: Low (client-side only logic).

────────────────────────────────
## 3. Explicit Boundaries
**IN SCOPE:**
- `src/components/modals/FileModal.tsx`: `handleSavePdf` logic.
- Implementing multi-page splitting for valid A4 generation.

**OUT OF SCOPE:**
- Server-side PDF generation.
- Changes to the analysis content itself (handled in CR-001).

────────────────────────────────
## 4. Acceptance Criteria
1.  PDF export generates a standard A4 size document.
2.  If text content exceeds one page height, a second page is automatically created.
3.  Text is not cut off between pages (or is split legibly).
4.  Margins are respected on all pages.

────────────────────────────────
## 5. Rollback Plan
1.  Revert changes to `handleSavePdf` in `FileModal.tsx`.

────────────────────────────────
## 6. Governance Acknowledgement
"Pre-Action Governance Check: OK"

────────────────────────────────
## 7. Owner
User (via Request Step 525)
