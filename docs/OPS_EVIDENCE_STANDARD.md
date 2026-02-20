# OPS EVIDENCE STANDARD

**Status:** ACTIVE  
**Purpose:** Establish immutable evidence tracking rules for system mutations.

## 1. What Proof is Required?

- **Deployment Proof:** Deployment Commit SHA + Workflow run_id.
- **Database Mutation Proof:** Explicit SQL log output + Target Environment mapping (e.g., Supabase Prod).
- **Execution Evidence:** Must capture Git SHA at the time of patch generation.
- **Status Change Evidence:** "Status 0" test confirming pre-conditions (e.g., no active schedules).

## 2. Where Does Evidence Live?

- Evidence artifacts must be stored chronologically inside the repository: `artifacts/<date>_evidence.md`.
- Historical evidence files act as system integrity rollback context.
