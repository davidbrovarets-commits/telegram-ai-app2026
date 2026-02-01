# Core Surface Definition (MVP)

Purpose:
This document explicitly defines the Core surface of the system.
Anything listed here is considered Core and is protected by
Architecture Freeze and Core vs Extensions Policy.

If an element is not explicitly listed as Core,
it MAY be treated as an Extension,
provided it does not alter Core behavior.

Core classification is based on system behavior,
not on code location, folder structure, or file names.

────────────────────────────────
## System Stage
(Applies to: MVP)
Status: ACTIVE

────────────────────────────────
## What is Core (Protected)

### 1) Core Pipelines
The following pipelines are Core and MUST NOT be modified after MVP DoD:
- News ingestion (RSS collection)
- Rule-based filtering and blocking
- LLM-based classification and summarization
- Translation pipeline (DE → UA)
- Geo-routing logic (Country → State → City)
- Deduplication (token-based / rule-based only)

────────────────────────────────
### 2) Core Data Models
The following data entities are Core:
- News items and their processing states
- User location preferences (Country / State / City)
- Processing queue and pipeline state tracking
- Banner metadata used in production

Schema changes to these entities are Core changes.

────────────────────────────────
### 3) Core Automation & Workflows
The following automation is Core:
- GitHub Actions for news ingestion
- GitHub Actions for banner generation
- Deployment workflows affecting production
- Governance Guard workflows

Changes to triggers, schedules, or logic of these workflows are Core changes.

────────────────────────────────
### 4) Core UI Flows
The following UI flows are Core:
- Primary news feed consumption
- Core assistant interaction used for news and admin help
- Any UI required to access or understand Core functionality

Refactoring these flows is a Core change.

────────────────────────────────
### 5) Core Configuration & Secrets
The following are Core:
- Environment variable contracts
- Service account usage for GCP and Supabase
- Production configuration required for Core pipelines

Changing configuration semantics is a Core change.

────────────────────────────────
## Allowed Extension Points (Explicit)

The following areas are explicitly allowed for Extensions,
provided they do not modify Core behavior:

- New UI tabs or pages not required for Core flows
- Optional assistant capabilities (additive only)
- Experimental features guarded by feature flags
- Read-only views or analytics based on Core data
- Auxiliary scripts not involved in Core pipelines

Extensions MUST be removable or disableable without impact on Core.

────────────────────────────────
## Classification Rule

- Any change affecting items listed under "What is Core" is a Core change.
- Any change not clearly classified as Extension is Core by default.
- Core changes are forbidden after MVP DoD except as defined in project_knowledge.md.

This document is authoritative for Core vs Extension classification.

In case of conflict between this document and any other description,
this document takes precedence for Core classification.
