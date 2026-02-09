# AI Inspector Contract

## Purpose
The AI Inspector serves as a **read-only watchdog** and **safe automated maintainer** for the News Image Pipeline. It verifies system health, reports anomalies, and performs limited Level 0 repairs (lock release) without human intervention, while strictly forbidding unexpected mutations or resource consumption.

## Scope
- **L1 Actions**: Reporting, Metrics Aggregation, Alerting.
- **L2 Runtime**: Scheduled Execution (15m), Event-Triggered (on failure).
- **L3 Data Plane**: Read access to `news` table; Write access ONLY for lock release (status reset).

## Allowed Actions (Whitelist)
1.  **Read** from `news` table (all fields).
2.  **Read** from Storage (list files for audit).
3.  **Execute** Generator script in **DRY RUN** mode (`NEWS_IMAGES_DRY_RUN_PROMPT=true`).
4.  **Write** to `GITHUB_STEP_SUMMARY` (formatted report).
5.  **Write** to DB: **Release Locks Only** (Reset `image_status='generating'` -> `'placeholder'` for stuck items).
    - Condition: `image_last_attempt_at` is older than (now - `INSPECTOR_LOCK_STUCK_MINUTES` minutes).
    - Flag: `INSPECTOR_ALLOW_LOCK_RELEASE=true`.

## Forbidden Actions (Hard)
1.  **No Imagen Calls**: Inspector must NEVER call Vertex AI / Imagen.
2.  **No Storage Uploads**: Inspector must NEVER upload files.
3.  **No Content Mutation**: Inspector must NEVER change `title`, `content`, or `image_prompt`.
4.  **No Infinite Loops**: Inspector allows strict timeout and concurrency limits.
5.  **No Recursive Triggers**: Inspector ignores its own failures.

## Severity Model
- **P0 (Critical)**:
  - Generator failures > Threshold (e.g. 10/hour).
  - Stuck items > Critical Threshold.
  - Action: Alert + Recommendation "PAUSE PIPELINE".
- **P1 (High)**:
  - Stuck items found (blocked queue).
  - Prompt Contract violations.
  - Action: AutoFix (if safe/enabled) or Alert.
- **P2 (Medium)**:
  - Metrics deviation (low throughput).
  - Action: Log + Warning.
- **P3 (Info)**:
  - Routine stats (24h counts).
  - Action: Log only.

## Stop Conditions
- If **AutoFix** is enabled but fails >> Stop and Alert.
- If **DB Connection** fails >> Exit 1.
- If **Dry Run** fails >> Exit 1 (Pipeline broken).

## Outputs (Report Contract)
- **JSON Report** (Console): Single source of truth.
- **Job Summary** (GitHub): Human-readable markdown with:
  - Status (PASS/WARN/FAIL).
  - Incidents List.
  - 24h Metrics.
  - Action Taken (e.g. "Released 5 locks").

## Autofix Policy (Level 0)
- **Default**: OFF (`INSPECTOR_ALLOW_LOCK_RELEASE="false"`).
- **Scope**: Release "stuck" locks only.
- **Mechanism**: Use shared `releaseImageLock` helper.
- **Gated**: Must be explicitly enabled via Environment Variable.
