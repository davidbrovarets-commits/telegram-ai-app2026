# CHANGE REQUEST: CR-004 (Strict PDF Content Box)

────────────────────────────────
## 1. Change Goal
Implement a rigid PDF pagination system that respects a Fixed Content Area.
Previous implementations relied on image slicing which failed to respect A4 margins on secondary pages.
The new system must strictly confine text execution to the defined box.

────────────────────────────────
## 2. Change Classification
**Classification: CORE**
Reason: UX/Export functionality improvement. High strictness requirement.

────────────────────────────────
## 3. Explicit Boundaries
**IN SCOPE:**
- `FileModal.tsx`: PDF Generation Logic.
- **MANDATORY Metrics**:
  - Top/Bottom Margin: 35mm
  - Left/Right Margin: 25mm
  - Content Width: 160mm
  - Content Height: 227mm

**OUT OF SCOPE:**
- Re-analyzing the document (content remains same).

────────────────────────────────
## 4. Acceptance Criteria
1.  **Margins**: Text MUST start at y=35mm and end at y=262mm on ALL pages.
2.  **Pagination**: Page break ensures text continues at y=35mm on next page.
3.  **No Clipping**: Text lines must not be cut in half (requires smart breaking).
4.  **Layout**: Page 1 and Page 2 must look identical in terms of text positioning boundaries.

────────────────────────────────
## 5. Technical Approach
Switch from manual `html2canvas` image slicing (which ignores text lines) to `jsPDF.html()` (or similar) which supports:
-   `autoPaging: 'text'`
-   `margin: [35, 25, 35, 25]`
-   `windowWidth`: scalable rendering.

────────────────────────────────
## 6. Governance Acknowledgement
"Pre-Action Governance Check: OK"

────────────────────────────────
## 7. Owner
User (via Request Step 628)
