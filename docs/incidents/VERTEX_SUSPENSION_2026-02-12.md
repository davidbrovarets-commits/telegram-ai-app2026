# INCIDENT REPORT — Vertex Billing Suspension (2026-02-12)

## Root Cause
Google Cloud project "claude-vertex-prod" was suspended due to abnormal API usage patterns.

Most likely trigger:
- Large image backlog (~1000+ pending)
- Parallel execution
- Aggressive retry logic
- Missing hard execution cap

## Risk Identified
Image generator can:
- Process unlimited pending items
- Run large batches
- Trigger repeated retries
- Exceed acceptable usage patterns

## Resolution Strategy
Introduce:
- Hard batch size limit
- Global per-run cap
- Concurrency cap
- Backoff on quota risk
- Automatic stop if threshold exceeded

Status: SAFETY GUARD DEPLOYED
