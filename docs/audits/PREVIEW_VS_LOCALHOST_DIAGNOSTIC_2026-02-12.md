# Read-Only Diagnostic: Preview vs Localhost Divergence
**Date:** 2026-02-12
**Scope:** Analysis of "Feed Duplication" and "Wrong Feed" symptoms on Firebase Preview.

## 1. Executive Diagnosis
The discrepancy between **Localhost (Working)** and **Firebase Preview (Failing)** is most likely caused by **Runtime Race Conditions** exacerbated by network latency, rather than a build artifact mismatch.

1.  **Latency-Exposed Race Condition**: `FeedManager.initialize()` triggers both `forceRefillFeed()` (via Edge Function) and `fillEmptySlots()` (via direct DB query) when the feed is empty. On Localhost, these complete fast or exist in a stable state (Hot Cache). On Preview, the "Cold Start" (empty localStorage) + Network Latency causes these two async flows to interleave, potentially appending the same items twice.
2.  **Cold Storage Start**: Preview runs on a unique origin (`...web.app`). It does NOT share `localStorage` with Localhost. It always starts "fresh" (empty feed), triggering the aggressive refill logic every time you visit (unless you stay on the page), whereas Localhost likely persists a stable "good" feed state.
3.  **Environment Parity**: The build process (`deploy.yml`) manually injects `VITE_SUPABASE_URL` from GitHub Secrets. If these secrets differ from your local `.env`, the Preview is literally verifying against a different database.

## 2. Evidence Table

| Symptom | Candidate Cause | Evidence Found | Confidence |
| :--- | :--- | :--- | :--- |
| **Duplicates** | **H4: Double Refill Race** | `useNews.ts` calls `initialize()`. `FeedManager.ts` calls `forceRefillFeed` AND `fillEmptySlots` if feed empty. Both modify `activeFeed`. | **HIGH** |
| **Wrong Feed** | **H1: Cold/Partitioned Storage** | Preview origin != Localhost origin. `newsStore` relies on `localStorage`. Preview starts with empty state, triggering full refill. | **HIGH** |
| **Duplicates** | **H3: Backend vs Edge Mismatch** | `forceRefillFeed` uses `serve-feed` (Edge). `fillEmptySlots` uses direct DB query. If specific exclusions differ (e.g., `usedIds`), they fetch overlapping sets. | **MEDIUM** |
| **Stale Code** | **H6: Caching/ServiceWorker** | No `sw.js` or `workbox` found in source. `firebase.json` has standard cache headers. Unlikely to be a "zombie" SW. | **LOW** |

## 3. Top 3 Likely Causes (Ranked)

1.  **Race Condition (Double Refill)**: The app sees an empty feed on fresh load (Preview). It fires `forceRefillFeed` (slow Edge Function) and `verifyFeedIntegrity/fillEmptySlots` (fast DB query) in parallel. Both see "empty slots" and both push news items, resulting in duplicates or a corrupted list.
2.  **Client-Side "Used ID" Desync**: The `usedIds` list (passed to logic to prevent duplicates) is calculated from the *current* state. If two requests launch simultaneously, they both see state as "empty" and both request the same "top news", ignoring each other's pending results.
3.  **Edge Function vs Client Logic Divergence**: The `serve-feed` function might behave differently (returning duplicates) compared to the client-side `fillEmptySlots` filtering logic, especially regarding "Last Resort" items.

## 4. Verification Steps (No Code Changes)

To confirm **Cause #1 (Race Condition)** without changing code:

1.  **Open Preview URL** in an Incognito Window (simulates fresh start).
2.  **Open DevTools (F12) -> Network**.
3.  **Reload**.
4.  **Observe**: Look for simultaneous requests to `functions/v1/serve-feed` AND `rest/v1/news?select=*`.
    *   If both fire at roughly the same time, the Race Condition hypothesis is confirmed.
    *   If you see the raw DB query (`rest/v1/news`) return items that appear in the feed *before* the Edge Function (`serve-feed`) returns, that's the duplication source.

To confirm **Cause #3 (Data Source)**:

1.  **Console Check**: In Preview, type `localStorage.getItem('news-storage')`. Compare the structure with Localhost.
2.  **Env Check**: Ensure GitHub Secrets `VITE_SUPABASE_URL` matches your local `.env`. (Requires GitHub Repo Admin access).

## 5. NO-CHANGE CONFIRMATION
I have performed a read-only audit.
- No files were modified (except this report).
- No git commits were made.
- No deployments were triggered.
- No background services were altered (except stopping local orchestrator).
