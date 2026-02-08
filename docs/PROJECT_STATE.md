
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
**How:** GitHub Actions workflow `.github/workflows/news-images.yml` runs every 15 minutes (and can be triggered manually).
**Inputs / Outputs (DB):**
- Selects items with `image_status in ('placeholder','failed')` (and < attempt limit).
- Sets `image_status='generating'` while processing.
- On success: sets `image_status='generated'`, updates `image_url`, records `image_prompt` (Imagen path), sets `image_source_type=('reference'|'imagen')`.
- On failure: sets `image_status='failed'`.

**Notes:** This is separate from hourly ingestion (`news-orchestrator.yml`) and hourly maintenance (`auto-healer.yml`).
