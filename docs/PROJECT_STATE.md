
## Code Police — Antigravity Preflight Gate (MVP)

Перед Proceed Antigravity обязан запускать:
- npm run type-check
- npm test
- npm run build

Proceed блокируется при любой ошибке.
Опционально: Vertex AI diff review (Gemini 2.5 Pro) в advisory-режиме.

---

## Hotfix: News images hidden by strict frontend guard (2026-02-08)

**Symptom:** Images missing on News feed cards and in opened news detail view.
**Root cause:** Frontend required `image_status === 'generated'` to render an image, even when `image_url` is present. DB currently stores latest items with `image_status='placeholder'` while `image_url` is populated.
**Fix (MVP-safe):** Relaxed frontend guard to render image whenever `image_url` exists and `image_status !== 'failed'`. Placeholder remains for empty URL or failed status.
**Scope:** Frontend only. No pipeline / CI / workflows changed.

---

## Automation: Per-item News Image Generator (Imagen 4) (2026-02-08)

**What:** Automated generation of images for individual news items via `scripts/generate_news_banners.ts` (Wikipedia reference first, Vertex AI Imagen 4 fallback).
**How:** GitHub Actions workflow `.github/workflows/news-images.yml` runs4.  **Schedule:** 15 minutes (Baseline).
**Patch 0 Hotfix (2026-02-09):** Removed unused imports, switched to native fetch, hardened `NEWS_IMAGES_BATCH_SIZE` parsing, and removed hardcoded Windows gcloud path.
**Patch 1 (2026-02-09):** Schedule updated to `*/4 * * * *` (4 min) for rapid testing.
**Patch 2 (2026-02-09):** Added Observability logging (prompts printed to console) and `NEWS_IMAGES_DRY_RUN_PROMPT=true` mode.
**Patch 2.1 (2026-02-09):** Hardened Dry Run logic (robust parsing + centralized lock release).
**Next:** Patch 3 (Prompt Contract).d manually).
**Inputs / Outputs (DB):**
- Selects items with `image_status in ('placeholder','failed')` (and < attempt limit).
- Sets `image_status='generating'` while processing.
- On success: sets `image_status='generated'`, updates `image_url`, records `image_prompt` (Imagen path), sets `image_source_type=('reference'|'imagen')`.
- On failure: sets `image_status='failed'`.

**Notes:** This is separate from hourly ingestion (`news-orchestrator.yml`) and hourly maintenance (`auto-healer.yml`).

---

## Infrastructure: Unified Service Account (Variant B) (2026-02-08)

**What:** Unification of Google Cloud Service Account for both Firebase Hosting and Vertex AI.
**Change:** `GITHUB_SECRETS.GOOGLE_CREDENTIALS` now contains the JSON key for `github-deployer@claude-vertex-prod...` which has both `Firebase Hosting Admin` and `Vertex AI User` roles.
**Impact:** `deploy.yml` (Firebase) and `news-images.yml` (Vertex) now use the same secret.
**Reason:** Fixes deployment failures caused by secret rotation/mismatch and simplifies key management.
