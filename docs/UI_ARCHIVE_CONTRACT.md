# UI ARCHIVE CONTRACT

**Status:** Draft (As-Is Snapshot)
**Version:** 1.0
**Implemented By:** `ArchiveView.tsx`

---

## 1. View Specifications

| Component | Logic |
|-----------|-------|
| **Container** | Full-screen view (`max-width: 600px`). |
| **Header** | "АРХІВ НОВИН" (Uppercase, Bold). |
| **Theme** | Gray Header Background `#8E8E93`. |
| **Navigation** | Back button (Top-Left Absolute). |

## 2. List Behavior

- **Source:** LocalStorage `history.archived[]` IDs.
- **Data Fetch:** Selects `*` from `news` table for these IDs.
- **Ordering:** Reverse chronological of addition (LIFO).
- **Empty State:** Centered text "Архів порожній" (Gray).

## 3. Card Specifications

- **Component:** `NewsCard` (Reused from Feed).
- **Variant:** `archive` (Passed as prop).
- **Interaction Mode:** 
  - **Swipe Left:** Delete (Permanent).
  - **Swipe Right:** Delete (Permanent).
  - **Click:** Open Detail View.

> [!WARNING]
> **No Restore:** There is no UI action to move an item from Archive back to Feed.

## 4. Correction Roadmap

1. **Add Restore Action:** Allow Swipe Right to "Restore" (Green).
2. **Sync Status:** Ensure Archive View filters out items deemed `DELETED` on server.
3. **Empty State:** Add illustration or better call-to-action.
