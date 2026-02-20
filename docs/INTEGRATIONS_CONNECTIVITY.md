# Integrations Connectivity Guide

**This document serves as the Single Source of Truth for how integrations are wired and verified within Navestic.**

## Philosophy: Non-interactive & Deterministic
In keeping with the project's adherence to "НЕ СМОТРИ, А ЧИТАЙ", integrations in this project rely entirely on environmentally-injected or explicitly-configured credentials. 
"Connected" means that the required configuration or secret is accessible by the code in CI (`.github/workflows/*.yml`) or local `.env` files. We **never** open a browser for OAuth callbacks during automation, and we do not commit secrets. 

## Integration Mapping & Configuration

### 1) GitHub Actions / CLI
- **Purpose**: CI workflows, repo automation, script testing.
- **Configured by**: Implicitly `GITHUB_TOKEN` in CI. Locally, `gh` relies on a Personal Access Token (PAT).
- **Missing Resolution safely**: To fix a Missing status, developers should individually authenticate using `gh auth login` or set a valid `GH_TOKEN` environment variable locally before running automation scripts.

### 2) Supabase (Data Layer)
- **Purpose**: SSOT for application data (News, User State).
- **Configured by**: `VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (Server-side scripts), `VITE_SUPABASE_ANON_KEY` (Client UI).
- **Missing Resolution safely**: Must insert credentials manually into `.env` tracking from the Supabase Project Dashboard. Keys must never be in version control.

### 3) Vertex AI (Google Cloud)
- **Purpose**: Gemini-based News translation and extraction tools.
- **Configured by**: `GOOGLE_PROJECT_ID` (or `GOOGLE_CLOUD_PROJECT`), Google Application Default Credentials (ADC) or explicit `GOOGLE_CREDENTIALS` service account json.
- **Missing Resolution safely**: Either install `gcloud` locally and run `gcloud auth application-default login` or set `GOOGLE_APPLICATION_CREDENTIALS` to a downloaded key path.

### 4) Firebase Hosting
- **Purpose**: UI Hosting deployment target.
- **Configured by**: `.firebaserc`, `firebase.json` for structure. Production credentials live as `VITE_FIREBASE_*` and `FIREBASE_TOKEN` / SA during CI.
- **Missing Resolution safely**: Configuration files exist natively in code. To connect CLI, run `firebase login` locally out-of-band. 

### 5) Telegram Bot API
- **Purpose**: Personal assistant messaging.
- **Configured by**: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.
- **Missing Resolution safely**: Generated via BotFather and placed in `.env` securely.

## Verifying Integrations
To safely re-verify everything without mutation:
```bash
npx tsx scripts/ops/verify_integrations.ts
```
This script queries endpoints securely to confirm auth without altering data.
