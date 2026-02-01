# CHANGE REQUEST: CR-005 (Server-Side PDF Renderer)

────────────────────────────────
## 1. Change Goal
Replace client-side `jsPDF` rendering with a deterministic, server-side PDF renderer using Headless Chromium on Google Cloud Run.
This ensures strict A4 pagination, fixed margins, and consistent rendering across devices ("print-grade" quality).

────────────────────────────────
## 2. Change Classification
**Classification: ARCHITECTURAL**
Reason: Introduces a new backend service (Cloud Run) and changes the "Core" pipeline for document exports.
Risk: Medium (Deployment required, Cost implications).

────────────────────────────────
## 3. Explicit Boundaries
**IN SCOPE:**
- New Service: `/services/pdf-renderer/` (Node.js + Puppeteer).
- Frontend API: `src/api/pdfRenderer.ts`.
- Frontend Styles: `src/pdf/printCss.ts`.
- Component: `FileModal.tsx` (Adapter logic only).
- Infrastructure: Google Cloud Run deployment.

**MANDATORY NORMATIVES:**
- Page Format: A4.
- Margins: 35mm (Top/Bottom), 25mm (Left/Right).
- Rendering: Chromium Headless (Puppeteer).

**OUT OF SCOPE:**
- Other exports (Excel, Text).
- Authentication (initially Token-based/Open inside strict CORS, moving to IAM later).

────────────────────────────────
## 4. Acceptance Criteria
1.  **Strict Layout**: Text starts strictly at 35mm top margin on Page 2.
2.  **Pagination**: Deterministic page breaks based on print rules.
3.  **Searchable**: PDF text must be selectable.
4.  **Integration**: Frontend "Save as PDF" button calls the service and downloads the file.
5.  **Deploy**: Service is running on Cloud Run.

────────────────────────────────
## 5. Rollback Plan
1.  Revert `FileModal.tsx` to `html2canvas` implementation.
2.  Delete Cloud Run service (to stop billing).

────────────────────────────────
## 6. Governance Acknowledgement
"Pre-Action Governance Check: OK"

────────────────────────────────
## 7. Owner
User (via Request Step 710)
