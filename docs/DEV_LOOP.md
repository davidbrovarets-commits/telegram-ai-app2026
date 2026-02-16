# Local Development Loop & Safe Defaults

This project uses a **"Soft Safety"** approach for local development. By default, all local runs are in `DRY_RUN` mode, meaning they will **NOT** mutate the production database or upload files.

## 🚀 Quick Start

### 1. Safe Simulation (Default)
Runs the full pipeline (Orchestrator + Healer) in simulation mode.
```bash
npm run dev:dry
```
- **Reads**: Real RSS feeds, real HTML.
- **AI**: Uses `mock` provider (free, fast) or real Vertex AI (if configured) but **skips writes**.
- **Writes**: NO database inserts, NO storage uploads.
- **Output**: Generates `dry_run_report.json` with would-be-inserted items.

### 2. Live Run (Production Mutation)
**⚠️ WARNING**: This WILL write to the production Supabase database and upload images.
```bash
npm run dev:run
```
- **Requires**: `DRY_RUN=false` explicit flag.
- **Use case**: You fixed a bug and want to process the *actual* news cycle manually from your machine.

### 3. CI Checks
GitHub Actions runs `npm run dev:dry` on every push to ensure the pipeline code doesn't crash.

## 🛡️ Safety Mechanisms

1.  **Global `DRY_RUN`**:
    - `scripts/local-dev-run.ts` forces `DRY_RUN='true'` if the env var is missing.
    - `scripts/orchestrator-l6.ts` checks `if (DRY_RUN) ...` before `insert()`.
    - `scripts/generate_news_banners.ts` checks `if (IS_DRY_RUN) ...` before `uploadToStorage()`.
    - `scripts/auto-healer.ts` checks `process.env.DRY_RUN` before any cleaning/fixing.

2.  **Mock AI**:
    - By default, `dev:dry` sets `AI_PROVIDER=mock` (in CI) or simply skips expensive Vertex calls if configured to do so.
    - Local runs *can* use real AI with `dry-run` to test prompt logic without saving results.

## 🐛 Debugging
If `dev:dry` fails:
1. Check standard logs in terminal.
2. Inspect `dry_run_report.json` to see what data *would* have been saved.
