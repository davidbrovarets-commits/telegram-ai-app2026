# Architecture Ideas & Deferred Design (Not Active)

Purpose:
- Store future improvements, options, experiments, and “ideal architecture” notes.
- This file MUST NOT contain mandatory rules for MVP.
- Nothing in this file is considered enforced.

## Rules for This File
Every item MUST include:
- (Target Stage: MVP | STABLE | SCALE)
- Status: IDEA | DESIGN INTENT | DEFERRED | EXPERIMENT
- Trigger: measurable condition that justifies implementation
- Risk: cost/latency/complexity risks
- Rollback: how to revert safely

## Backlog Items

### Automated Critique Agent (Daily Architect)
(Target Stage: STABLE)
Status: DEFERRED

Trigger:
- User command: "ACTIVATE DAILY ARCHITECT"
- GitHub Actions variable: `DAILY_ARCHITECT_ENABLED=true`

Risk:
- Generates non-essential change proposals
- Increases cognitive load during MVP execution
- May encourage premature optimization

Rollback:
- Remove or unset `DAILY_ARCHITECT_ENABLED`
- Disable or delete the associated cron workflow
- Confirm agent state is PAUSED

### Vector-based Deduplication (Embeddings)
(Target Stage: STABLE)
Status: DESIGN INTENT (DEFERRED)

Trigger:
- Duplicate rate across layers > 15% for 7 consecutive days
  OR total ingested items > 300/day and duplicates > 40/day.

Risk:
- Increased latency and cost (embeddings + vector DB)
- Added operational complexity (indexing, drift, monitoring)

Rollback:
- Disable embeddings pipeline
- Revert to token/rule-based deduplication only
