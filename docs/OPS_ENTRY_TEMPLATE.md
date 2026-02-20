# OPS ENTRY TEMPLATE

Use this template to start any systematic change or investigation.

## Goal
[1-2 sentences strictly defining the objective]

## Task Type
[SAFE PATCH / INVESTIGATION / DEEP]

## Systems Touched
[e.g., GitHub / Supabase / Firebase / GCP / Vertex]

## Mutations Allowed
[Yes/No - Specifies if DB or external states can be mutated]

## Evidence Required
[e.g., SHA + run_id / SQL output / specific artifacts]

## Rollback Plan
[How to revert in case of failure: e.g. git revert / manual DB queries / not applicable]

## Stop Conditions
[Strict list of events or findings that require halting execution]

## Files to Touch
[List of exact file paths or structural layers involved]

## Acceptance Tests
[1 goal = 1 test: How to deterministically prove the fix]

## Notes / Constraints
[Any extra context or limitations]
