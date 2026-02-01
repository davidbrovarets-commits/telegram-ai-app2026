# AI GOVERNANCE ENTRY POINT (MANDATORY)

Purpose:
This document is the mandatory entry point for ALL actions
performed by Antigravity or any AI agent operating in this repository.

NO action may be executed before this document is read and applied.

────────────────────────────────
## Binding Rule (Non-Negotiable)

Before performing ANY of the following:
- code changes
- architectural decisions
- workflow modifications
- configuration changes
- UI changes
- automation updates
- governance updates

The agent MUST perform a governance check
according to this document.

Skipping this step INVALIDATES the action.

────────────────────────────────
## Mandatory Governance Check Order

Before acting, the agent MUST read and verify compliance with
the following documents IN THIS EXACT ORDER:

1) project_knowledge.md  
   → System stage, Architecture Freeze, Core vs Extensions rules

2) docs/core_surface.md  
   → What is protected Core vs allowed Extensions

3) CHANGE_REQUEST.md  
   → Whether a valid Change Request exists

4) docs/feature_flags.md  
   → Whether a feature flag is required

5) docs/release_sop.md  
   → Whether the action follows release procedure

6) docs/environment_contract.md  
   → Whether environment parity is preserved

7) docs/data_ownership.md  
   → Whether data mutation rules are respected

8) docs/incident_sop.md  
   → Whether the action is incident-related

9) docs/architecture_ideas.md  
   → For ideas ONLY (never enforcement)

If ANY document blocks the action → STOP immediately.

────────────────────────────────
## Required Pre-Action Output

Before executing an action, the agent MUST explicitly state:

"Pre-Action Governance Check: OK"

If this statement is missing,
the action MUST NOT be executed.

────────────────────────────────
## Enforcement Priority

This file has the HIGHEST priority.

In case of conflict:
- AI_GOVERNANCE.md overrides all other instructions
- Governance documents override user convenience
- Safety and determinism override speed

────────────────────────────────
## User Authority

Only the repository owner (user) may:
- override governance
- approve Core changes
- approve Architecture Freeze exit
- activate paused agents

All overrides MUST be explicit and logged.

────────────────────────────────
## Final Rule

If unsure → STOP.
If unclear → ASK.
If governance is missing → DO NOTHING.

This document is permanent and mandatory.
