
# NAVESTIC AGENT PROTOCOL — ARCHITECTURE AWARE VERSION
Applies To: All Antigravity Agents operating on Navestic  
Status: ACTIVE  
Enforcement: Mandatory  

========================================================
0) CORE PRINCIPLE
========================================================

Navestic is an Architecture-Frozen, Layered System.

Agents MUST operate as controlled surgical instruments,
NOT as autonomous refactoring systems.

Primary Rule:
Preserve architectural boundaries.
Never optimize outside explicit scope.

========================================================
1) SYSTEM ARCHITECTURE MODEL
========================================================

Navestic Architecture Layers:

L0 — Infrastructure Layer
- Supabase (Postgres, RLS, Storage)
- Firebase Hosting
- GitHub Actions
- Vertex AI
- Environment variables
- Deployment configuration

L1 — Data Model Layer
- Tables (news, news_user_state, etc.)
- ENUMs
- Constraints
- Indexes
- Triggers
- RLS policies

L2 — Service Layer
- src/services/**
- NewsUserStateService
- Business logic
- DB access gateway
- SSOT enforcement

L3 — Query Layer
- Feed queries
- Archive queries
- Filtering logic
- Visibility rules

L4 — UI Contract Layer
- Swipe interaction contract
- Card rendering rules
- View mode logic
- Gesture semantics

L5 — AI Pipeline Layer
- Gemini generation
- Imagen banners
- generate_news_banners.ts
- auto-healer.ts
- Orchestrator
- Prompt logic

L6 — Governance Layer
- CR documents
- STATE_MACHINE.md
- Structural Normative Layers
- Architecture Freeze rules

Agents MUST respect layer boundaries.

========================================================
2) SSOT (Single Source of Truth) MODEL
========================================================

Global State:
- news.status controls global visibility

Per-User State:
- news_user_state.status controls user-specific visibility

Rules:
- User actions NEVER mutate news.status
- All per-user writes go through NewsUserStateService
- LocalStorage is optimistic only
- DB is authoritative

Agents must verify SSOT compliance before making changes.

========================================================
3) EXECUTION DEPTH PROTOCOL
========================================================

Before generating any AG TASK FILE:

STEP 1 — CLASSIFY TASK
- SAFE PATCH
- INVESTIGATION
- DEEP INVESTIGATION

If unsure → escalate to deeper mode.

STEP 2 — DEFINE EXECUTION MODE
Insert at top of AG file:
EXECUTION MODE: SAFE PATCH / INVESTIGATION / DEEP INVESTIGATION

STEP 3 — GENERATE STRUCTURED AG FILE
Sections MUST be in this order:

1) EXECUTION MODE
2) PRECONDITIONS
3) RULES
4) GOAL
5) SCOPE
6) STOP CONDITIONS
7) OUT OF SCOPE

No deviations allowed.

========================================================
4) ARCHITECTURE BOUNDARY RULES
========================================================

Agents MUST:

- Modify only explicitly listed files
- Perform minimal diff
- Avoid renaming symbols unless required
- Avoid cross-layer edits
- Never refactor outside scope
- Never “improve” unrelated code

Agents MUST NOT:

- Touch AI pipeline during state tasks
- Touch Firebase during DB tasks
- Modify orchestration during UI tasks
- Modify prompts during structural changes
- Introduce new dependencies
- Change table schema unless explicitly requested

========================================================
5) DEEP INVESTIGATION MODE REQUIREMENTS
========================================================

If EXECUTION MODE is DEEP INVESTIGATION:

Agent MUST:

- Model timeline of system behavior
- List minimum 3 hypotheses
- Eliminate hypotheses using evidence
- Inspect DB state before code
- Inspect network responses
- Inspect RLS behavior
- Inspect PostgREST schema cache state
- NOT implement fix during investigation phase
- Produce system behavior model first

Agent must STOP after investigation report.

No fixes until explicitly authorized.

========================================================
6) MIGRATION SAFETY PROTOCOL
========================================================

Before applying DB migrations:

Agent must verify:

- Table existence (to_regclass)
- Enum existence (to_regtype)
- Trigger existence
- RLS status
- Policy names

If mismatch detected:
STOP.
Do not alter schema silently.

Never modify existing production schema
unless explicitly authorized.

========================================================
7) MUTATION GUARD PROTOCOL
========================================================

Before structural changes:

- Cancel all in-progress workflows
- Disable scheduled workflows
- Confirm 0 active runs

Never re-enable workflows automatically
unless explicitly instructed.

========================================================
8) DETERMINISM RULES
========================================================

- updated_at must be DB-authoritative
- Clients must NOT send timestamps
- No client-clock based logic
- No non-deterministic ordering
- No race-condition prone patterns
- No async behavior without modeling

========================================================
9) STOP CONDITIONS STANDARD
========================================================

Agent MUST STOP if:

- Behavior becomes non-deterministic
- Table missing or schema mismatch
- RLS blocks writes unexpectedly
- Query returns inconsistent data
- State diverges after reload
- Unexpected cross-layer dependency detected

Report before continuing.

========================================================
10) CASCADE PREVENTION RULE
========================================================

Agents are over-active by default.

Therefore:

- One task = one goal
- One change set per file
- No multi-file expansion without explicit scope
- No speculative fixes
- No style changes
- No formatting-only commits

========================================================
11) ARCHITECTURE FREEZE RULE
========================================================

If task touches:

- AI pipeline
- Prompt system
- Orchestrator
- Hosting
- Infrastructure

Agent must assume ARCHITECTURE FREEZE
unless Change Request explicitly authorizes change.

========================================================
12) HANDOVER PROTOCOL
========================================================

Every handover must include:

- Execution depth classification
- Full AG TASK FILE protocol
- Architectural layer context
- Current risk profile
- What NOT to reopen

This prevents cross-chat drift.

========================================================
13) PRIORITY ORDER
========================================================

When conflicts occur, follow priority:

1. Data integrity
2. Determinism
3. SSOT compliance
4. Architectural boundaries
5. Performance
6. UX improvements

========================================================
END OF PROTOCOL
========================================================

All agents must treat this document as governing law
when operating within Navestic.
