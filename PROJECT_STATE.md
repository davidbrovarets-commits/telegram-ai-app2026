
## Registry Drift Guard

Added CI enforcement preventing divergence between:

- Runtime registry (scripts/registries/source-registry.ts)
- Documentation list (docs/UUDISTE_ALLIKATE_NIMEKIRI.md)

CI workflow: registry-drift-check.yml

Status: ACTIVE

## Operational Rules

- Integrations are credential-driven; no auto-connect. Verification via CLI/script only.
- Connectivity bootstrap produces INTEGRATION_STATUS_REPORT.md.


## Workflow Scheme

Canonical end-to-end operational workflow: `docs/WORKFLOW_SCHEME.md`


## One Chat, Two Modes SOP

- **SOP:** `docs/OPS_ONE_CHAT_SOP.md`
- **Handover Protocol:** Before switching Antigravity chats, generate a handover doc in `docs/HANDOVER/`. New chats must read the latest handover file first.
