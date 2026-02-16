
# NEWS PAGE LIVE AUDIT (READ-ONLY) — 2026-02-09T03:44:19.727Z

## 1. Precheck (Secrets + Network + Auth)
- **Secrets**: VITE_SUPABASE_URL: PASS, SUPABASE_SERVICE_ROLE_KEY: PASS, SUPABASE_NEWS_BUCKET: FAIL
- **Network**: PASS
- **Auth**: PASS
- **Status**: PASS

## 2. Inventory (Counts)
- **TOTAL**: 236
- **By Level**:
  - COUNTRY: 224
  - BUNDESLAND: 4
  - CITY: 8
- **By Bundesland**:
  - Brandenburg: 1
  - Baden-Württemberg: 1
  - Sachsen: 3
  - Bayern: 2
  - Nordrhein-Westfalen: 3
  - Mecklenburg-Vorpommern: 1
  - Saarland: 1

## 3. Image Coverage
- **DB References**: 177
- **Sample Validation** (10 tested):
  - Found: 10
  - Missing: 0
- **Status Health**:
  - placeholder: 228
  - failed: 7
  - generated: 1
- **Stuck Items (Top 10 Oldest)**:
  - None

## 4. Freshness
- **Oldest**: 2025-11-16T06:54:00+00:00
- **Newest**: 2026-02-08T22:24:00+00:00
- **Stale (>72h)**: 59

## 5. Leipzig (Exact)
- **Total**: 0
- **With Image**: 0
- **Oldest**: N/A
- **Newest**: N/A
- **Note**: All items assumed visible (no hidden flag found in schema).

## 6. Coverage Gaps
**Cities with ZERO news**:
- Leipzig
- Frankfurt am Main
- Düsseldorf
- Essen
- Hannover
- Nürnberg
- Duisburg
- Bochum
- Bielefeld
- Bonn
- Münster
- Karlsruhe
- Mannheim
- Augsburg
- Potsdam
- Schwerin
- Magdeburg
- Kiel
- Erfurt
- Wiesbaden
- Mainz
- Gelsenkirchen
- Chemnitz
- Braunschweig
- Regensburg
- Freiburg im Breisgau

## 7. Workflow Runtime Status (Config Only)
*Note: Runtime API access unavailable. Reporting configuration.*
- **ai-inspector-on-failure.yml**: Schedule="None", Enabled=true
- **ai-inspector.yml**: Schedule="*/15 * * * *", Enabled=true
- **auto-healer.yml**: Schedule="0 * * * *", Enabled=true
- **deploy-supabase.yml**: Schedule="None", Enabled=true
- **deploy.yml**: Schedule="None", Enabled=true
- **governance_guard.yml**: Schedule="None", Enabled=true
- **infrastructure.yml**: Schedule="None", Enabled=true
- **news-images-legacy-purge.yml**: Schedule="None", Enabled=true
- **news-images-monitor.yml**: Schedule="0 * * * *", Enabled=true
- **news-images.yml**: Schedule="*/4 * * * *", Enabled=true
- **news-orchestrator.yml**: Schedule="0 * * * *", Enabled=true
- **personal-assistant.yml**: Schedule="*/5 * * * *", Enabled=true
- **weekly-banner.yml**: Schedule="0 8 * * 1", Enabled=true
- **weekly-prod-update.yml**: Schedule="0 7 * * 1", Enabled=true

## 8. Functional Limitations
- **Read-Only Mode**: YES (Enforced by role)

## 9. GO / NO-GO
- **Status**: GO
- **Reason**: Data is accessible and flowing.
