
## CR-007: n8n Integration Readiness (MVP Safe)

**Status**: Implemented (Disabled Schedules)
**Date**: 2026-02-07

### Observability Layer
- **New Feature**: Read-only Status API (`/status`)
- **Security**: Protected by `X-Status-Token` (Header). No public access.
- **Data Scope**: Returns aggregated counts (News total/24h, Image statuses) and Orchestrator health.
- **Privacy**: No PII or specific article content returned.

### External Triggering (Safe Mode)
- **New Feature**: `DRY_RUN` mode for `orchestrator-l6.ts`
- **Behavior**: 
  - If `DRY_RUN=true`: **ZERO** database writes, **ZERO** AI calls, **ZERO** storage uploads.
  - Generates a JSON artifact report instead of mutating state.
- **Access**: Via GitHub Actions `workflow_dispatch` input `dry_run: true`.

### Constraints & Guards
- **Architecture Freeze**: Respected. No new services or DB users.
- **Write Access**: n8n has **NO** write credentials.
- **Execution**: All logic remains inside GitHub Actions trusted runner.
