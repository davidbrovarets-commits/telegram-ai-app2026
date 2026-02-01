# CHANGE REQUEST: CR-001 (Ukrainian Analysis Results)

────────────────────────────────
## 1. Change Goal
Ensure that the AI analysis of uploaded documents produces results in Ukrainian instead of English.
The current default prompt results in English text, which contradicts the localized nature of the app.

────────────────────────────────
## 2. Change Classification
**Classification: CORE**
Reason: Modifies `src/utils/api.ts`, which is part of the Core Pipeline (LLM interactions).
However, it is a low-risk configuration change (prompt tuning) rather than a logic refactor.

────────────────────────────────
## 3. Explicit Boundaries
**OUT OF SCOPE:**
- `src/services/ai/AIService.ts` (The underlying service engine MUST remain generic).
- Any changes to the UI (`FileModal.tsx`) beyond displaying the result (which is already markdown).
- Any changes to other AI functions (Chat, News).

────────────────────────────────
## 4. Acceptance Criteria
1.  Uploaded documents are analyzed by Gemini.
2.  The resulting text is strictly in Ukrainian.
3.  The structure of the analysis (headers, lists) remains readable.
4.  No errors or timeouts are introduced by the longer prompt.

────────────────────────────────
## 5. Rollback Plan
1.  Revert the string change in `src/utils/api.ts`.
2.  Redeploy.

────────────────────────────────
## 6. Governance Acknowledgement
"Pre-Action Governance Check: OK"

────────────────────────────────
## 7. Owner
User (via Request Step 455)
