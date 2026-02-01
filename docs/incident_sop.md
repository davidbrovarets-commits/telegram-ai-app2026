# Incident Response SOP (MVP)

Purpose:
Define a calm, deterministic procedure
for handling production incidents without panic.

────────────────────────────────
## System Stage
(Applies to: MVP)
Status: ACTIVE

────────────────────────────────
## What Is an Incident

An incident is ANY of the following:
- Core functionality is unavailable
- Incorrect data is produced
- Automation fails silently
- Users receive wrong or missing output

────────────────────────────────
## Incident Handling Procedure

1) Stop the damage
   - Disable feature flags if applicable
   - Stop affected automation if required

2) Assess impact
   - Identify affected users and features
   - Determine severity

3) Apply minimal fix
   - Fix ONLY what resolves the incident
   - No refactors, no improvements

4) Verify resolution
   - Confirm system stability
   - Confirm Core behavior is correct

5) Document
   - Record incident and resolution
   - Note root cause and rollback

────────────────────────────────
## Prohibited During Incidents

- Panic refactoring
- Unreviewed changes
- “While we are here” improvements

This SOP is mandatory during MVP.
