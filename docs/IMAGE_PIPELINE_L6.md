# IMAGE PIPELINE L6 (MVP)

**Status:** ACTIVE
**System Stage:** MVP

## 1. Core Principles
1.  **Non-Blocking Frontend:** The UI must NEVER wait for an image. If `image_status` is not `generated`, render the placeholder.
2.  **Deterministic State:** Every item moves through a defined lifecycle: `placeholder` → `generating` → `generated` OR `failed`.
3.  **Real-World Anchoring:** Banners prefer real photographic references (Wikipedia/Wikimedia) over AI generation.
4.  **Strict Fallback (Imagen 4):** If no reference is found, use **Imagen 4** with a strict "Documentary Photo" prompt policy.

## 2. Pipeline Stages

### Stage A: Ingestion
- New items are inserted with `image_status = 'placeholder'`.
- `image_url` is NULL or empty.

### Stage B: Banner Job (Async)
Runs periodically (or triggered):
1.  **Claim:** Selects oldest `placeholder` or `failed` (attempts < 3) items. Sets status to `generating`.
2.  **Reference Check:**
    - Checks Wikipedia/Wikidata for a lead image of the Person or Place mentioned.
    - If found: Downloads, resizing (16:9), uploads to Storage. Sets `image_status = 'generated'`, `image_source_type = 'reference'`.
3.  **Fallback Generation (Imagen 4):**
    - If no reference:
    - Constructs a prompt starting with "A documentary photo of...".
    - Calls Vertex AI (Imagen 4).
    - Uploads result.
    - Sets `image_status = 'generated'`, `image_source_type = 'imagen'`.
4.  **Failure:**
    - If any step fails, sets `image_status = 'failed'`.
    - Increments `image_generation_attempts`.
    - Item remains text-only (placeholder) in UI.

## 3. Observability
- Status columns in `news_items` provide instant insight into pipeline health.
- Logs track `claim`, `generate_success`, `generate_fail`.

## 4. Acceptance Criteria
- [ ] No infinite loops (maxAttempts=3).
- [ ] UI always renders immediately.
- [ ] Reference images are preferred.
- [ ] Imagen 4 prompts are documentary/neutral.
