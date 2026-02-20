
## Registry Drift Guard

Added CI enforcement preventing divergence between:

- Runtime registry (scripts/registries/source-registry.ts)
- Documentation list (docs/UUDISTE_ALLIKATE_NIMEKIRI.md)

CI workflow: registry-drift-check.yml

Status: ACTIVE

## Operational Rules

- Integrations are credential-driven; no auto-connect. Verification via CLI/script only.
- Connectivity bootstrap produces INTEGRATION_STATUS_REPORT.md.
