# Environment Contract (MVP)

Purpose:
Define an explicit, non-negotiable contract between
local, staging (if any), and production environments.
This document prevents configuration drift and
“works locally but not in prod” failures.

────────────────────────────────
## System Stage
(Applies to: MVP)
Status: ACTIVE

────────────────────────────────
## Environment Parity Rules

- Local and Production MUST use the same:
  - runtime versions
  - configuration keys
  - feature flag semantics
- Differences are allowed ONLY in secret VALUES, not structure.

If a config key exists in one environment,
it MUST exist in all environments.

────────────────────────────────
## Forbidden Actions

- Adding environment-specific logic
- Using “prod-only” or “local-only” behavior
- Manual changes directly in production

────────────────────────────────
## Verification Rule

Before any release:
- Configuration keys MUST be compared
- Missing or extra keys → STOP release

This contract is mandatory during MVP.
