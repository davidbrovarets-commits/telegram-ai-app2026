MODEL DECISION:
[ANALYST]

REASON:
[Brief technical justification]

USE MODEL:
[ANALYST MODEL (Claude / reasoning-first)]

================================================================================
AG TASK FILE — [INVESTIGATION TITLE] — NAVESTIC
================================================================================

EXECUTION MODE:
INVESTIGATION (READ-ONLY)

PRECONDITIONS
- Strictly READ-ONLY. No mutations, no deploy, no schema changes.
- RUNTIME RULE “НЕ СМОТРИ, А ЧИТАЙ”: no browser verification.

GOAL
[Specific question or systemic gap to answer]

SCOPE
[Search paths, databases, log structures]

REQUIRED EVIDENCE COMMANDS
- `rg` / `git grep` 
- `gh run list`
- SQL read-only queries

DELIVERABLE OUTPUT FORMAT (Print to chat)
1. **Findings:** [Facts gathered with source file references]
2. **Root cause:** [Summarized issue]
3. **Options:** [Alternative paths forward]
4. **Recommended patch (SAFE PATCH):** [Provide exact Steps and Acceptance Tests for a follow-up EXECUTOR task]

STOP CONDITIONS (HARD)
- If the investigation requires logging or executing write operations to gather context → STOP.

END
