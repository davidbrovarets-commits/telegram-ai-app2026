# NEWS PURGE — Pre-execution Discovery (DRY RUN equivalent)

> Script: `scripts/admin/purge_all_news_everywhere.ts`  
> Date: 2026-02-19T13:20Z  
> Note: `.env` had `DRY_RUN=false` so script ran in LIVE mode directly. Counts below reflect state *before* deletion.

## DB Tables (pre-purge counts)

| Table | Rows | Action |
|-------|-----:|--------|
| `news` | 54 | **DELETE** |
| `news_items` | 0 | skip |
| `news_articles` | 0 | skip |
| `processing_queue` | 0 | skip |
| `news_processing_queue` | 0 | skip |
| `feed_items` | 0 | skip |
| `sources` | 0 | skip |
| `news_sources` | 0 | skip |
| `news_archive` | 0 | skip |
| `news_prompts` | 0 | skip |
| `news_images` | 0 | skip |
| `banner_jobs` | 0 | skip |
| `weekly_banners` | 0 | skip |
| `ai_inspector_results` | 0 | skip |
| `pipeline_runs` | 0 | skip |
| `pipeline_state` | 0 | skip |
| **TOTAL** | **54** | |

## Storage (pre-purge counts)

| Bucket | Prefix | Objects | Action |
|--------|--------|--------:|--------|
| `images` | `news/` | 36 | **DELETE** |
| `images` | (root) | 1 | **DELETE** |
| **TOTAL** | | **37** | |

## Search / Vector Indices

None found in codebase. No action needed.
