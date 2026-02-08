# Architectural Decisions Log

## ADR-007: Safe n8n Integration Pattern

*   **Status**: Accepted
*   **Date**: 2026-02-07
*   **Context**: We need to expose system status to n8n for orchestration without exposing database credentials or allowing uncontrolled mutations.
*   **Decision**: 
    1.  Implement a read-only Edge Function (`/status`) protected by a bearer token (`X-Status-Token`).
    2.  Implement a `DRY_RUN` mode in the Orchestrator script to allow safe triggering via GitHub Actions `workflow_dispatch`.
*   **Consequences**:
    *   n8n can poll for status and trigger runs safely.
    *   No direct DB access for n8n.
    *   Mutations are strictly confined to the trusted GitHub Actions environment.
