
# Execution Governance (MVP)

**Purpose:** prevent overlapping runs, retry storms, and burst-pattern API usage that can trigger provider suspensions.
**Non-goals:** no new orchestration services; no scale architecture.

## Controls

1.  **Concurrency:** `cancel-in-progress` for every heavy workflow.
2.  **Cron Deconflict:** Heavy workflows must not start on the same minute (avoid minute 0).
3.  **Incident Freeze:** During stabilization/patching and any AI-provider incident, all schedules must be disabled and all in-progress runs cancelled before changes and tests.
4.  **Reactivation Order:** Monitor → Orchestrator → Image Generator → Auto-Healer → Secretary → Weekly jobs.
- **Auth Standard (CI):** Workflows must use `google-github-actions/auth@v2` (ADC). Do **not** pass `VERTEX_API_KEY` via workflow env. Vertex access must be via centralized vertex-client and ADC tokens.
