# Project Knowledge & Architectural Decisions

---
## SYSTEM STAGE
SYSTEM_STAGE = MVP
**Current Stage: MVP (Single-Operator, Pre-Scale)**

### Definition:
- System is operated by a single owner.
- Primary goals: correctness, determinism, reproducibility.
- Optimization, scale, and cost-reduction are SECONDARY.
- Any solution that increases cognitive or operational overhead is **FORBIDDEN** unless it fixes an active problem.

### Stage Transition Rules:
- **MVP → STABLE** only after:
  - 14 consecutive days without production incidents
  - deterministic CI/CD (no manual hotfixes)
  - stable news ingestion + summarization pipeline

### Global Constraints (MVP Stage):
- No architecture may be added "for future scale only"
- No optimization is allowed without measured pain
- Simplicity beats elegance
- Any behavior, mechanism, or automation that implicitly assumes STABLE or SCALE conditions (multiple operators, high traffic, cost optimization, auto-refactoring) is considered STAGE DRIFT and is FORBIDDEN during MVP.
- **NON-NEGOTIABLE**

---

> [!IMPORTANT]
> **VERIFIED-ONLY RULE:**
> This file contains ONLY ACTIVE, battle-tested, currently enforced rules and decisions.
> Anything that is not implemented, not validated in production, or is deferred MUST NOT be in this file.
> Such content MUST be moved to `docs/architecture_ideas.md`.

---

## Mandatory Pre-Action Governance Check
**(Applies to: ALL SYSTEM STAGES)**
**Status: ACTIVE**

Before executing ANY action requested by the user
(including but not limited to: code changes, refactors, new features, new UI tabs,
workflow updates, architectural suggestions, or automation changes),
the agent MUST perform the following steps IN ORDER:

1. **Re-read the document:**
   `"Project Knowledge & Architectural Decisions"` IN FULL.

2. **Explicitly determine and state:**
   - Current SYSTEM STAGE
   - Whether Architecture Freeze is active
   - Whether the requested action affects Core or is an Extension

3. **Validate the action against:**
   - Architecture Freeze & Stop Criteria
   - Core vs Extensions Policy
   - Definition of Done (DoD) rules
   - Automated Critique Agent Governance

4. **If the action is NOT explicitly allowed by these rules,**
   the agent MUST refuse to execute it and explain which rule forbids it.

5. **If the action is allowed,**
   the agent MUST state which rules permit it before proceeding.

**CRITICAL RULE:**
If this Pre-Action Governance Check is skipped or incomplete,
the agent MUST NOT execute the requested action under any circumstances.

---

## Architecture Freeze & Stop Criteria
**(Applies to: MVP)**
**Status: ACTIVE**

### Architecture Freeze Rule (MVP)
If ALL conditions below are true, the system enters ARCHITECTURE FREEZE mode:

- CI/CD pipelines succeed deterministically for 7 consecutive days
- No production incidents requiring manual intervention
- News ingestion, summarization, and publishing pipelines run end-to-end without human fixes
- No unresolved CRITICAL bugs are open

While in ARCHITECTURE FREEZE:
- NO refactoring is allowed
- NO architectural changes are allowed
- NO optimizations are allowed
- ONLY bug fixes with clear user impact are permitted

### STOP Conditions (MVP)

Architecture and system behavior are considered "GOOD ENOUGH" when:
- The system produces correct outputs
- The system is reproducible from a clean checkout
- Operational cost is within expected MVP bounds
- Latency is acceptable for human-facing usage

Once STOP conditions are met:
- Further improvements are FORBIDDEN unless they fix an active problem

### Controlled Re-Entry Rule

Breaking ARCHITECTURE FREEZE is allowed ONLY if at least one is true:
- A production incident occurred
- A measurable regression in correctness, latency, or cost is detected
- A SYSTEM STAGE transition is explicitly approved (e.g. MVP → STABLE)

All re-entry MUST:
- State the specific trigger
- State the expected measurable improvement
- Be reversible

---

## Automated Critique Agent Governance
**(Applies to: MVP)**
**Status: ACTIVE**

### Current State: PAUSED
- The "Daily Architect" automated critique routine is PAUSED.
- It MUST NOT run on schedule.
- It MUST NOT be re-enabled implicitly by any refactor, workflow update, or automation cleanup.

### Reactivation Rule (User-Only)
Reactivation is allowed ONLY if the user explicitly issues the command:

`"ACTIVATE DAILY ARCHITECT"`

No other phrasing, inference, or "best practice" justification is allowed.

### Allowed Outputs When Active (Firewall)
When active, the critique agent:
- MUST write proposals ONLY to `docs/architecture_ideas.md`
- MUST NOT modify `project_knowledge.md`
- MUST NOT modify production code
- MUST NOT create PRs or commits without an explicit user command

### Operational Enforcement
- The ONLY supported activation mechanism is a GitHub Actions environment variable:
  `DAILY_ARCHITECT_ENABLED=true`
- If this variable is missing or not equal to "true", the critique agent MUST exit immediately.
- No alternative flags, files, heuristics, or implicit activation methods are allowed.
- Any GitHub Actions cron workflow associated with this agent MUST check this variable as the FIRST step and exit otherwise.

---

## Definition of Done (DoD) — MVP
**(Applies to: MVP)**
**Status: ACTIVE**

### MVP is considered DONE when ALL conditions below are true:

#### 1) Functional Completion (End-to-End)
- News ingestion runs on schedule without manual intervention
- News items are filtered, summarized, translated, and published correctly
- The Telegram assistant responds correctly to user input
- Weekly news banners are generated automatically and deployed successfully

Perfection is NOT required. Stability and correctness ARE required.

#### 2) Operational Completion
- Repository can be cloned and started from a clean checkout
- CI/CD pipelines run deterministically without hotfixes
- All secrets are managed via environment variables or secret managers
- No manual steps are required for normal operation

#### 3) Architectural Completion (MVP Core)
- Core pipelines and flows are implemented and stable
- Architecture Freeze & Stop Criteria are satisfied
- No unresolved CRITICAL bugs exist in Core functionality

#### 4) Cognitive Completion
- project_knowledge.md represents the enforced truth of the system
- docs/architecture_ideas.md contains all future or deferred ideas
- The system behavior is predictable and understandable by its owner

When ALL the above are true:
- MVP is officially DONE
- Core enters permanent ARCHITECTURE FREEZE for MVP stage

Final MVP DoD confirmation requires an explicit owner declaration.

---

## Core vs Extensions Policy
**(Applies to: MVP)**
**Status: ACTIVE**

### Core (Frozen after MVP DoD)
The Core includes:
- News ingestion, summarization, translation, and publishing pipelines
- CI/CD workflows and automation jobs
- Existing critical UI flows used by users
- Data models required for current functionality

Rules for Core:
- Core MUST NOT be refactored after MVP DoD
- Core changes are allowed ONLY for:
  - Critical bug fixes
  - Security issues
  - Explicit SYSTEM STAGE transition (MVP → STABLE)

---

### Extensions (Allowed After MVP DoD)
Extensions MAY be developed before MVP DoD,
provided they do not modify Core behavior
and remain removable or disableable without impact.

Extensions include:
- New UI tabs or pages
- New assistant capabilities
- Optional features not required for MVP correctness
- Experimental or additive functionality

Rules for Extensions:
- Extensions MUST NOT change Core behavior
- Extensions MUST be removable or disableable without affecting Core
- Extensions MUST NOT introduce new infrastructure that destabilizes MVP
- Extensions SHOULD be guarded by feature flags or configuration switches

### Enforcement Rule
- Any feature that modifies Core behavior is NOT an Extension
- If a change cannot clearly be classified as an Extension, it is considered a Core change and is FORBIDDEN after MVP DoD
- Violations of this rule invalidate the MVP freeze

---

## Architectural Rules Protocol
**(Applies to: MVP)**
**Status: ACTIVE**

**HARD RULE:** ALL architectural decisions, patterns, and protocols in this repository MUST explicitly state which SYSTEM STAGE they apply to. Rules without an explicit SYSTEM STAGE marker are considered INVALID by default.

### Stage Declaration Template (MANDATORY):
- **(Applies to: MVP | STABLE | SCALE)**
- **Status: ACTIVE**

**Validity Rule:**
Rules missing BOTH markers are INVALID by default.

### Operational Truth
- If a rule is written here, CI/CD and scripts MUST enforce it.
- If it is not enforced, it must not be written here.

---

## Overview
Informational section (not a rule). Markers not required.

This project is a Telegram AI-powered assistant and news orchestrator designed for Ukrainian migrants in Germany. It provides localized news, administrative guidance, and interactive support.

## Core Architecture
**(Applies to: MVP)**
**Status: ACTIVE**
- **Frontend**: React + TypeScript + Vite.
- **Backend / Storage**: Supabase (PostgreSQL, Realtime, Storage).
- **AI Engine**: Google Vertex AI (Gemini 2.5 Pro for text/logic, Imagen for banners).
- **Deployment**: Local execution (Secretaries), GitHub Actions (Automation).

## Key Components

### 1. Multi-Layer News Orchestrator
**(Applies to: MVP)**
**Status: ACTIVE**
- **Layers**: Country (DE) → Bundesland (State) → City.
- **Goal**: Deliver highly relevant news to Ukrainians based on their specific location in Germany.
- **Agent Pipeline**:
  - Collection (RSS feeds).
  - Rule-based filtering (Keywords/Blocklists).
  - LLM Classification & Summarization (Gemini).
  - Translation (German → Ukrainian).
  - Geo-routing.
  - Deduplication (Token-based/Rule-based only).

### 2. Personal Secretary Bot
**(Applies to: MVP)**
**Status: ACTIVE**
- **Hybrid Mode**: Combined "Live Mode" (long-polling/server-side) and scheduled "Cloud Mode".
- **Interaction**: Natural language understanding, image processing (vision), and administrative assistance.

### 3. News Banner System
**(Applies to: MVP)**
**Status: ACTIVE**
- **Purpose**: Generates weekly AI-visualized banners for news categories.
- **Engine**: Google Vertex AI Imagen.
- **Automation**: Weekly GitHub Action.

## Major Architectural Decisions

### Modular Pipeline Pattern
**(Applies to: MVP)**
**Status: ACTIVE**
- **Decision**: Evolve from monolithic scripts to a modular pipeline where each processing step (Collect, Filter, Enrich, Persist) is a discrete, testable unit.
- **Rationale**: Improves maintainability, testability, and allows for interchangeable components (e.g., swapping AI providers).

### Persistent State-Aware Pipeline
**(Applies to: MVP)**
**Status: ACTIVE**
- **Decision**: Persist the state of items in a `processing_queue` throughout their lifecycle.
- **Rationale**: Ensures resilience against failures, enables easy retries/self-healing, and provides observability into the pipeline's health.

### Geo-Scoped Scaling
**(Applies to: MVP)**
**Status: ACTIVE**
*(Note: Essential for logic/filtering, implementation is active)*
- **Decision**: Use a logic-based routing system (`CITY` > `STATE` > `COUNTRY`) to manage information density and relevance.
- **Rationale**: Prevents users from being overwhelmed while ensuring they don't miss critical local news.

## Technical Standards
**(Applies to: MVP)**
**Status: ACTIVE**
- **Language**: TypeScript (Strict mode).
- **Environment**: ESM, Node.js 20+.
- **Security**: Service accounts for GCP, Supabase RLS, Environment variables for all secrets.

---

### Frontend Image Rendering Rule (Factual)

As of 2026-02-08, the News UI renders images based on `image_url` presence rather than requiring `image_status='generated'`.

- If `image_url` is non-empty and `image_status !== 'failed'`, the UI displays the image.
- If `image_url` is empty OR `image_status='failed'`, the UI displays a placeholder.

Rationale (MVP): backend image generation may be disconnected; `image_url` may still contain a usable scraped/default URL.

---

### Per-item News Images (Imagen 4) — Automation (Factual)

As of 2026-02-08, per-item news images are generated automatically by GitHub Actions:
- Workflow: `.github/workflows/news-images.yml` (every 15 minutes)
- Script: `scripts/generate_news_banners.ts`
- Strategy:
  1) Try Wikipedia thumbnail as reference image.
  2) If no reference found, generate with Vertex AI Imagen 4 using a prompt derived from (title + uk_summary + location) plus strict negative constraints (no text/logos/watermarks).
- Persistence:
  - Upload image to Supabase Storage and write the public URL into `news.image_url`.
  - Update lifecycle fields: `image_status`, `image_prompt` (Imagen only), `image_source_type`.

This automation is intentionally decoupled from hourly ingestion to avoid slowing down news collection.
