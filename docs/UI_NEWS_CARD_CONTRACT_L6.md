# UI NEWS CARD CONTRACT L6

**Status:** ACTIVE
**Scope:** `SwipeableNewsCard.tsx`, `NewsView.tsx`

## 1. Layout Contract
- **Column:** SINGLE COLUMN only.
- **Card Count:** 6 cards visible per view (MVP).
- **Cards:** Must be fully swipeable (Left/Right).

## 2. Content Contract
### A. Pre-Image Line
- **Limit:** 1 sentence, ≤10 words.
- **Language:** Ukrainian.
- **Purpose:** Context or "Kicker" (e.g., "Politics · Berlin").

### B. Image
- **Ratio:** 16:9.
- **Behavior:**
    - If `image_status == 'generated'`: Show `image_url`.
    - Else: Show Placeholder (optimised SVG or generated pattern).
- **Text:** NO text overlay on the image itself.

### C. Source Line
- **Format:** "Allikas: <Source Name> · <Date>"
- **Style:** Subtle, smaller font.

### D. Post-Image Summary
- **Limit:** 5–7 sentences, ≤200 words.
- **Structure:** 1 sentence per line (preferred for readability).
- **Content:** Must NOT repeat the Pre-Image Line.

### E. Actions
- **Read More:** Rectangular button, aligned right. Label: "Читати далі (оригінал)".
- **Swipe:**
    - **Left:** Archive (Save for later / Remove from feed).
    - **Right:** Delete (Hide forever).

## 3. Technical Rules
- **Non-Blocking:** Frontend processes `news_items` array. If image is missing, it does NOT fetch it sync. It uses what is in the record.
- **Dedup:** Frontend logic must ensure `summary` text does not contain the `title` if `title` is used as Pre-Image Line.

## 4. Verification
- Swipe Left -> Item Disappears (Archived).
- Swipe Right -> Item Disappears (Deleted).
- Visual check: No double text.
