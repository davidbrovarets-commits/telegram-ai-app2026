# Release & Deploy SOP (MVP)

Purpose:
Define a deterministic, repeatable procedure
for releasing changes from local development to production.
This SOP prevents partial releases, silent failures,
and mismatches between local and production environments.

────────────────────────────────
## System Stage
(Applies to: MVP)
Status: ACTIVE

────────────────────────────────
## Preconditions (Must be true BEFORE release)

- A Change Request exists and is approved
- "Pre-Action Governance Check: OK" is acknowledged
- Local build completes without errors
- No unresolved CRITICAL issues are open
- All intended changes are committed to the repository

If any precondition fails → STOP. Do not release.

────────────────────────────────
## Release Types

### 1) Standard Release
Used for:
- Extensions
- Non-breaking changes
- Routine updates

### 2) Hotfix Release
Used ONLY for:
- Production incidents
- Critical bugs affecting users
- Security issues

Hotfixes MUST be minimal and reversible.

────────────────────────────────
## Release Procedure (Standard)

1) Verify local state
   - Clean working tree
   - Correct branch checked out
   - Local app runs as expected

2) Commit changes
   - Commit message references Change Request
   - No unrelated changes included

3) Push to remote
   - Push to the designated branch (e.g. main)

4) CI/CD execution
   - Verify GitHub Actions start automatically
   - Monitor pipeline until completion

5) Production verification
   - Confirm production URL reflects new version
   - Verify core functionality behaves identically to local

Release is complete ONLY after production verification.

────────────────────────────────
## Hotfix Procedure (Emergency)

1) Declare incident
   - Identify affected functionality
   - Confirm severity is CRITICAL

2) Apply minimal fix
   - Change ONLY what is required to resolve incident

3) Immediate deploy
   - Push fix
   - Monitor CI/CD closely

4) Verify resolution
   - Confirm issue is resolved in production

5) Post-action note
   - Record incident and resolution in decision_log.md

────────────────────────────────
## Failure Handling

If CI/CD fails:
- Do NOT retry blindly
- Inspect logs
- Fix the root cause
- Re-run pipeline intentionally

If production does not update:
- Verify correct branch was deployed
- Verify CI/CD completed successfully
- Check environment configuration
- Do NOT apply manual fixes in production

────────────────────────────────
## Rollback Procedure

If a release causes regression:
- Revert the offending commit(s)
- Trigger a new deployment
- Verify production rollback
- Document the rollback reason

────────────────────────────────
## Prohibited Actions

- Manual changes in production
- Skipping CI/CD
- Deploying without Change Request
- Deploying during Architecture Freeze (except Hotfix)

This SOP is mandatory for all releases during MVP.
