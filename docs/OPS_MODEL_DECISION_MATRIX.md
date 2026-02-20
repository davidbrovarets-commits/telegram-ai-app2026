# OPS MODEL DECISION MATRIX

**Status:** ACTIVE  
**Purpose:** Ensure predictable capability matching when initiating new task directives.

## When to use ANALYST Model

Use the **Analyst Model** (e.g., Claude Thinking / reasoning-heavy models) for:
- Architecture discovery
- Structural deep dives
- Root cause investigation (read-only)
- Gathering context without mutating variables
- Planning complex refactors

## When to use EXECUTOR Model

Use the **Executor Model** (e.g., Gemini 3.1 Pro High / action-first models) for:
- Implementing defined plans and patches
- Data cleanup (deterministic script execution)
- Repo refactoring (structural movement)
- Verification scripts + evidence generation

## When to use MIXED Mode (Default rule)

**Explicit Rule:** Mixed = 2 tasks.
Never merge analysis and execution into a single prompt directive.
1. Run ANALYST to produce a concrete plan (AG TASK FILE).
2. Run EXECUTOR to implement the exact plan.

## Core Directives

- **No assumptions:** All findings and tests must be grounded in deterministic evidence.
- **Visual verification is FORBIDDEN:** The system must not rely on "looking at the UI" to prove a code change worked.
