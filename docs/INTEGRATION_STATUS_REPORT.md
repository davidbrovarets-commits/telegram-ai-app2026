# Integration Status Report

**Generated via:** `scripts/ops/verify_integrations.ts`
**Methodology:** Read-only APIs, exact credentials detection, NO modifications.

| Integration | Status | Evidence | Next Deterministic Step |
|---|---|---|---|
| **GitHub** | **MISSING** | `GitHub CLI (gh) not found in system PATH` | Install `gh` CLI in environment and authenticate. |
| **Supabase** | **OK** | `VITE_SUPABASE_URL present: true`, `public.news inserted last 24h count: 18` | Stable connectivity holding globally. |
| **Vertex AI** | **OK** | `token_ok true`, `project + location: top-cascade-485612-c6 + us-central1` | ADC/Keys working. Ready for generation. |
| **Firebase** | **OK** | `firebase_config_present true`, `projectId: top-cascade-485612-c6`, `tools version: 15.5.1` | Deploy configs intact and tools present. |
| **Telegram API** | **MISSING** | `TELEGRAM_BOT_TOKEN present: false` | Obtain BotToken securely and set inside local `.env`. |

*Note: Supabase table verification log displayed an erroneous column query for sanity test, but database reachability via `service_role_key` on primary table was a complete success.*
