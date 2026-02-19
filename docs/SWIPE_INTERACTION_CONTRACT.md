# SWIPE INTERACTION CONTRACT

**Status:** Active
**Version:** 2.1 (CR-008 Persistence Model Added)
**Implemented By:** `SwipeableNewsCard.tsx` + `NewsUserStateService.ts`

---

## 1. Persistence Model (SSOT)

**Source of Truth:** `news_user_state` table (PostgreSQL).
**Optimistic UI:** `localStorage` (cache only).

| User Action | DB Transition (SSOT) |
|-------------|----------------------|
| **Swipe LEFT (Feed)** | `upsert(status='ARCHIVED')` |
| **Swipe RIGHT (Feed)** | `upsert(status='DELETED')` |
| **Swipe (Archive View)** | `upsert(status='DELETED')` |
| **Restore (Archive)** | `delete()` (Row removed -> Item becomes ACTIVE) |

> [!IMPORTANT]
> **Read Path Rule:**
> - Feed Query excludes `ARCHIVED` and `DELETED` rows for the current user.
> - Archive Query includes ONLY `ARCHIVED` rows for the current user.

## 2. Interaction Model

The card interaction model changes based on the **View Mode** (Feed vs Archive).

| Gesture | Feed View | Archive View |
|---------|-----------|--------------|
| **Swipe RIGHT (→)** | **DELETE** (Red) | **DELETE** (Red) |
| **Swipe LEFT (←)** | **ARCHIVE** (Gray) | **DELETE** (Red) |
| **Tap** | Open Detail | Open Detail |

> [!NOTE]
> **Behavior Inversion:** In the Feed, Left is "Save/Archive". In the Archive, Left is "Delete". This is implemented in `SwipeableNewsCard.tsx` via `mode` prop.

## 2. Technical Specs

- **Technology:** Framer Motion `drag="x"`
- **Threshold:** `60px` drag distance required to trigger action.
- **Feedback:** 
  - Opacity transition on icon/label: `0 → 1`
  - Z-index layering: Active action layer raises above background.

## 3. Visual Feedback

### Feed Mode
| Direction | Background | Icon | Label |
|-----------|------------|------|-------|
| **Right (→)** | Error/Red `#FF3B30` | `Trash2` | "Видалити" |
| **Left (←)** | System/Gray `#8E8E93` | `Archive` | "В архів" |

### Archive Mode
| Direction | Background | Icon | Label |
|-----------|------------|------|-------|
| **Right (→)** | Error/Red `#FF3B30` | `Trash2` | "Видалити" |
| **Left (←)** | Error/Red `#FF3B30` | `Trash2` | "Видалити" |

## 4. State Impact

- **On Trigger:** 
  - Calls `onDelete()` or `onArchive()` prop.
  - Does **NOT** immediately remove card from DOM (parent list handles removal via state update).
- **Drag Elasticity:** `0.7` (Rubber band effect).

## 5. Correction Roadmap

1. **Standardize Colors:** Ensure red/gray semantics are consistent.
2. **Haptic Feedback:** Add vibration on threshold cross.
3. **Undo Toast:** Display "Item archived/deleted" toast with Undo button.
