# CHANGE REQUEST — MANDATORY CHANGE CONTRACT

Purpose:
This document defines the REQUIRED contract for any change
(code, architecture, workflow, UI, automation, or configuration).

No change may be executed without an explicit Change Request.

────────────────────────────────
## Change Request Template

### 1. Change Goal (1–2 sentences)
Describe EXACTLY what problem is being solved.
No background, no future ideas.

### 2. Change Classification
Select ONE:
- CORE (modifies Core behavior or pipelines)
- EXTENSION (additive, removable, no Core impact)

If unclear → it is CORE by default.

### 3. Explicit Boundaries (What MUST NOT change)
List concrete components/files/behaviors that are OUT OF SCOPE.

Example:
- Core news ingestion pipeline
- Existing CI/CD workflows
- Production database schema

### 4. Acceptance Criteria
Define 2–5 verifiable conditions that must be true after the change.

Example:
- Feature can be enabled/disabled without affecting Core
- Existing pipelines produce identical output

### 5. Rollback Plan
Describe how to safely revert this change
in case of failure or regression.

### 6. Governance Acknowledgement
Before execution, the following statement MUST be included verbatim:

"Pre-Action Governance Check: OK"

### 7. Owner
Name of the person approving and owning this change.

────────────────────────────────
## Enforcement Rules

- Any change without a Change Request is INVALID.
- Any change that violates declared boundaries is INVALID.
- Any change without acceptance criteria is INVALID.
- Any change without rollback plan is INVALID.
- Any behavioral change not explicitly listed in Acceptance Criteria is INVALID.

This document is PROCESS GOVERNANCE.
It does not authorize changes by itself.
Authorization is defined in project_knowledge.md.
