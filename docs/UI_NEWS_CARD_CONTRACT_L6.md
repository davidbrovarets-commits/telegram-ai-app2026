# UI NEWS CARD CONTRACT L6

**Status:** ACTIVE
**Scope:** `SwipeableNewsCard.tsx`, `NewsView.tsx`
**Related:** `SWIPE_INTERACTION_CONTRACT.md`, `newsTextRules.ts`

## 1. Layout Contract
- **Column:** SINGLE COLUMN only.
- **Card Count:** 6 cards visible per view (MVP).
- **Structure:** Title -> Image -> Date -> Short Summary.
- **Interaction:** Whole card clickable (Detail View).

## 2. Content Contract (SSOT)

> [!IMPORTANT]
> All text limits are strictly enforced by `src/config/newsTextRules.ts`. 
> See `docs/NEWS_TEXT_LIMITS_AUDIT.md` for full rules.

### A. Title (Top)
- **Limit:** 7–10 words (SSOT).
- **Language:** Ukrainian.
- **Purpose:** Context or "Kicker".
- **Rendering:** Raw (No client-side truncation).

### B. Image
- **Ratio:** 16:9.
- **Behavior:**
    - If `image_status == 'generated'`: Show `image_url`.
    - Else: Show Placeholder (optimised SVG or generated pattern).
- **Text:** NO text overlay on the image itself.

### C. Date Line (New Location)
- **Location:** Immediately below Image.
- **Alignment:** Right.
- **Format:** `DD.MM.YYYY` (e.g., 08.02.2026).
- **Content:** Date only. NO "Source" text.

### D. Short Summary
- **Limit:** 30–45 words (SSOT).
- **Source:** `uk_summary`.
- **Rendering:** Raw (No client-side truncation).

### E. Actions
See [SWIPE_INTERACTION_CONTRACT](SWIPE_INTERACTION_CONTRACT.md) for full details.

- **Swipe Left:** Archive (Save).
- **Swipe Right:** Delete (Hide).
- **Click:** Opens Detail View.

## 3. Technical Rules
- **Non-Blocking:** Frontend processes `news` array. If image is missing, it does NOT fetch it sync. It uses what is in the record.
- **Dedup:** Frontend logic must ensure `summary` text does not contain the `title` if `title` is used as Pre-Image Line.
- **Overlay:** NO text overlay allowed on the image (e.g. no city badge on image).

## 4. Verification
- Swipe Left -> Item Disappears (Archived).
- Swipe Right -> Item Disappears (Deleted).
- Visual check: No double text.
- Visual check: No text on top of image.
