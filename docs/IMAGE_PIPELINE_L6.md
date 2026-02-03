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
- News are inserted with `image_status = 'placeholder'`.
- `image_url` is NULL or empty.

### Stage B: Banner Job (Async)
Runs periodically (or triggered):
1. **Claim:** Claims `limit=5` items (priority: **Newest** first) where `image_status in ('placeholder','failed')` and `attempts < MAX`.
2. **Reference check (Wikipedia/Wikimedia):**
   - Attempts to fetch a large thumbnail.
   - Uploads the reference image as-is; UI crops visually via `object-fit: cover` (server-side crop is future enhancement).
   - Sets: `image_status='generated'`, `image_source_type='reference'`, stores attribution fields if available.
3. **Fallback generation (Imagen 4):**
   - Builds a strict prompt starting with: “A documentary photo of …”
   - Adds global negatives: no text, no logos, no watermarks, not illustration/cartoon, no propaganda/stereotypes, no distorted faces.
   - Calls Vertex AI Imagen 4 and uploads result.
   - Sets: `image_status='generated'`, `image_source_type='imagen'`, stores `image_prompt`.
4. **Failure:**
   - Sets `image_status='failed'`, stores short `image_error`, increments attempts.
   - UI continues to show placeholder (frontend never blocks).

## 3. Observability
- Status columns in `news` provide instant insight into pipeline health.
- Logs track `claim`, `generate_success`, `generate_fail`.

## 4. Acceptance Criteria
- [ ] No infinite loops (maxAttempts=3).
- [ ] UI always renders immediately.
- [ ] Reference images are preferred.
- [ ] Imagen 4 prompts are documentary/neutral.
