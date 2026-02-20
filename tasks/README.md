# Antigravity Task Execution Directives (`tasks/`)

Welcome to the central repository of task templates for navigating the Antigravity (AG) Agent workflow.

## Overview
This folder contains the skeletons necessary to initiate tasks within a **single AG chat**. Using these templates enforces the ORCHESTRATOR → EXECUTOR → REVIEW loop dictated by the `docs/OPS_ONE_CHAT_SOP.md`.

## Workflow
1. **ORCHESTRATOR:** Define the goal inside `_TEMPLATE_TASK.md` or `_TEMPLATE_INVESTIGATION.md`. Paste it into the Antigravity chat.
2. **EXECUTOR:** The AG Agent processes the task, implements it, and creates an Evidence Pack in `artifacts/`.
3. **REVIEW:** David inspects the Evidence Pack, commits result, and marks the task Complete.

## Templates Available
- `_TEMPLATE_TASK.md`: For safe patches, migrations, feature implementations. Requires explicit preflight mutations.
- `_TEMPLATE_INVESTIGATION.md`: For read-only analysis, root cause hunting, architecture queries. Strict no-mutation guarantee.

## Creating a Handover
When an Antigravity chat session reaches its limit or context breaks:
1. Copy the `docs/HANDOVER/_TEMPLATE.md`.
2. Save it as `docs/HANDOVER/HANDOVER_YYYY-MM-DD_HHMM.md`.
3. Start a new chat, paste or point the AG Agent to this Handover file first.
