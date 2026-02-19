# NEWS PURGE — DB Plan

> Generated: 2026-02-19

## Candidate Tables (FK-safe order)

| # | Table | Exists | Pre-purge Rows | FK Dependencies |
|---|-------|--------|---------------:|-----------------|
| 1 | `news` | ✅ | 54 | none detected |
| 2 | `news_items` | ✅ | 0 | none detected |
| 3 | `news_articles` | ✅ | 0 | none detected |
| 4 | `processing_queue` | ✅ | 0 | none detected |
| 5 | `news_processing_queue` | ✅ | 0 | none detected |
| 6 | `feed_items` | ✅ | 0 | none detected |
| 7 | `sources` | ✅ | 0 | none detected |
| 8 | `news_sources` | ✅ | 0 | none detected |
| 9 | `news_archive` | ✅ | 0 | none detected |
| 10 | `news_prompts` | ✅ | 0 | none detected |
| 11 | `news_images` | ✅ | 0 | none detected |
| 12 | `banner_jobs` | ✅ | 0 | none detected |
| 13 | `weekly_banners` | ✅ | 0 | none detected |
| 14 | `ai_inspector_results` | ✅ | 0 | none detected |
| 15 | `pipeline_runs` | ✅ | 0 | none detected |
| 16 | `pipeline_state` | ✅ | 0 | none detected |

Delete strategy: `DELETE WHERE id > 0`, fallback to `NOT NULL`, fallback to `created_at >= '1900-01-01'`.
