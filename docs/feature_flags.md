# Feature Flags Policy (MVP)

Purpose:
This document defines the mandatory policy for using feature flags
to control Extensions safely during MVP.
Feature flags ensure that Extensions are removable, reversible,
and do not destabilize Core functionality.

────────────────────────────────
## System Stage
(Applies to: MVP)
Status: ACTIVE

────────────────────────────────
## When Feature Flags Are REQUIRED

A feature flag is REQUIRED for:
- Any Extension that changes user-visible behavior
- Any experimental or optional functionality
- Any new UI tab or page not required for Core flows
- Any feature that may need to be disabled quickly

If unsure → feature flag is REQUIRED by default.

────────────────────────────────
## What Feature Flags MUST NOT Do

Feature flags MUST NOT:
- Change Core pipelines or logic
- Modify data schemas of Core entities
- Be used to bypass governance rules
- Hide incomplete Core functionality

If a flag affects Core behavior → it is NOT an Extension.

────────────────────────────────
## Feature Flag Scope & Storage

During MVP, feature flags MUST be:
- Simple boolean flags (ON / OFF)
- Evaluated at runtime, not compile time

Allowed storage locations:
- Environment variables
- Configuration tables (read-only at runtime)

Dynamic rule engines or complex rollout systems are FORBIDDEN during MVP.

────────────────────────────────
## Naming Convention

Feature flags MUST follow this naming pattern:

FEATURE_<SHORT_NAME>_ENABLED

Examples:
- FEATURE_STATS_TAB_ENABLED
- FEATURE_EXPERIMENTAL_ASSISTANT_ENABLED

Names must be explicit and unambiguous.

────────────────────────────────
## Default State

- Default state for all new feature flags is OFF
- Enabling a flag requires an explicit action
- Flags MUST NOT be enabled implicitly

────────────────────────────────
## Kill Switch Rule

Every flagged feature MUST support immediate disablement.

If a feature causes errors or instability:
- Disable the flag immediately
- Verify Core behavior is unaffected
- Investigate separately

No code changes are allowed as a first response to instability.

────────────────────────────────
## Cleanup Rule

When an Extension becomes permanent:
- Either remove the feature flag entirely
- Or explicitly reclassify the feature as Core
- Update project_knowledge.md and core_surface.md accordingly

Stale or forgotten flags are FORBIDDEN.

────────────────────────────────
## Enforcement

- Any Extension without a required feature flag is INVALID
- Any flag that violates this policy is INVALID
- Feature flags do NOT override Architecture Freeze or Core rules

This policy is mandatory during MVP.
