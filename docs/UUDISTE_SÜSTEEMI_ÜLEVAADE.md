# Uudiste Süsteemi Ülevaade (News System Overview)

## System Architecture

The news system is a multi-agent orchestrator that ingests, filters, classifies, deduplicates, and enriches news from various sources to provide relevant information to Ukrainian migrants in Germany.

## Agents

1. **Collector**: Ingests RSS/Atom feeds from the Source Registry.
2. **Filter**: Applies strict keyword and blocklist rules.
3. **Classifier**: Assigns topics and relevance scores.
4. **Router**: Routes news to Country, State, or City layers.
5. **Dedup**: Removes duplicates based on URL and content.
6. **Enricher**: Uses AI to summarize, translate, and extract actions.

## Hardening Measures (Feb 2026)

## Determinism & Dedup

- Primary dedup: canonicalized URL key (UTM-stripped) + stable hash.
- Secondary dedup: normalized title exact match.
- Optional near-duplicate policy: token-overlap threshold for small candidate sets.
- Selection is deterministic: stable sort (published_at desc, urlKey asc) and per-scope caps:
  - Country / Bundesland / City caps + total run cap.

## Failure Modes & Fallbacks

- RSS/source failures do not abort runs; failures are logged and processing continues.
- Gemini timeout/error triggers a safe fallback summary (title-based) and sets reasonTag = `AI_FALLBACK`.
- Imagen errors mark image failed (or log in DRY_RUN) and keep placeholder/reference-first fallback.
- Per-item failures are isolated; runs succeed if any items succeed.

## Cost Controls

- Hard caps: max articles per run and per scope, max AI calls per run, max image generations per run.
- Timeouts for AI and Imagen calls.
- Retry with exponential backoff for transient errors (429/503/timeouts).
- Concurrency limits prevent burst patterns.

## Safety (Mutation Guard)

All mutations are wrapped via `scripts/lib/mutation-guard.ts` (hard enforcement). Mutations require explicit `DRY_RUN='false'`.

## Registry Governance

The authoritative source list is defined in:

scripts/registries/source-registry.ts

The markdown file docs/UUDISTE_ALLIKATE_NIMEKIRI.md is documentation only.

A CI workflow verifies that the documented registry does not drift from the runtime registry definition.

Any mismatch will fail CI.
