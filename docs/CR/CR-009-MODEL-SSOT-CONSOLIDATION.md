# CR-009 — MODEL SSOT CONSOLIDATION

**Status:** PROPOSED
**Date:** 2026-02-20
**Owner:** Navestic

## 1. Goal
Unify the Single Source of Truth (SSOT) for AI Model selections. Currently, the application logic spreads model definitions and selections across multiple files (e.g., `vertex-client.ts`, `model-router.ts`, workflow YAML files).

## 2. Issues Addressed
- Risk of fragmentation: updating models requires modifying multiple files safely.
- No authoritative map for capabilities (`ANALYST`, `EXECUTOR`, `FAST`).

## 3. Scope
**In Scope:**
- Creating a single unified configuration file (or ENV protocol) for defining models.
- Refactoring `vertex-client.ts` and `model-router.ts` to consume this central configuration.

**Out of Scope:**
- No pipeline feature rewrites.
- No changes to prompt tuning or text rule logic.

## 4. Acceptance Plan
- "One Source" validation: All pipeline model requests trace back to a single unified reference.
- CI and orchestrator tests pass end to end without regressions.
