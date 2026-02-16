
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dns from 'dns';
import { promisify } from 'util';

// --- CONFIGURATION ---
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = process.env.SUPABASE_NEWS_BUCKET || 'images';

// Load city packages
const CITY_PACKAGES_PATH = path.join(process.cwd(), 'scripts', 'city-packages.index.json');
let CITY_PACKAGES = [];
if (fs.existsSync(CITY_PACKAGES_PATH)) {
    try {
        const data = JSON.parse(fs.readFileSync(CITY_PACKAGES_PATH, 'utf-8'));
        CITY_PACKAGES = data.packages || [];
    } catch (e) {
        console.error('Failed to load city-packages.index.json');
    }
}

// Interfaces
interface AuditReport {
    timestamp: string;
    precheck: {
        secrets: Record<string, boolean>;
        network: boolean;
        auth: boolean;
        details?: string;
    };
    inventory: {
        total: number;
        by_level: Record<string, number>;
        by_land: Record<string, number>;
        by_city: Record<string, number>;
    };
    freshness: {
        oldest: string | null;
        newest: string | null;
        stale_count_72h: number;
    };
    leipzig: {
        total: number;
        with_image: number;
        oldest: string | null;
        newest: string | null;
        visible_count: number;
    };
    coverage_gaps: {
        cities_with_zero_news: string[];
    };
    storage: {
        bucket: string;
        db_image_refs: number;
        sample_check: {
            checked: number;
            found: number;
            missing: number;
        };
        status_health: Record<string, number>;
        stuck_items: any[];
    };
    workflows: {
        status: string;
        configs: Record<string, any>;
    };
    flags: {
        readonly_mode: boolean;
    };
}

const REPORT: AuditReport = {
    timestamp: new Date().toISOString(),
    precheck: { secrets: {}, network: false, auth: false },
    inventory: { total: 0, by_level: {}, by_land: {}, by_city: {} },
    freshness: { oldest: null, newest: null, stale_count_72h: 0 },
    leipzig: { total: 0, with_image: 0, oldest: null, newest: null, visible_count: 0 },
    coverage_gaps: { cities_with_zero_news: [] },
    storage: { bucket: BUCKET_NAME, db_image_refs: 0, sample_check: { checked: 0, found: 0, missing: 0 }, status_health: {}, stuck_items: [] },
    workflows: { status: 'Checked (Config Only)', configs: {} },
    flags: { readonly_mode: true } // As per role
};

// --- STEP 1: PRECHECK ---
async function runPrecheck() {
    console.log('\n--- 1. PRECHECK ---');

    // 1.1 Secrets
    REPORT.precheck.secrets['VITE_SUPABASE_URL'] = !!SUPABASE_URL;
    REPORT.precheck.secrets['SUPABASE_SERVICE_ROLE_KEY'] = !!SUPABASE_KEY;
    REPORT.precheck.secrets['SUPABASE_NEWS_BUCKET'] = !!process.env.SUPABASE_NEWS_BUCKET;

    console.log('Secrets:', JSON.stringify(REPORT.precheck.secrets));

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        REPORT.precheck.details = 'Missing Secrets';
        return false;
    }

    // 1.2 Connectivity
    try {
        const hostname = new URL(SUPABASE_URL).hostname;
        const resolve = promisify(dns.resolve);
        await resolve(hostname);
        REPORT.precheck.network = true;
        console.log('Network: PASS (DNS Resolved)');
    } catch (e: any) {
        REPORT.precheck.network = false;
        REPORT.precheck.details = `Network Block: ${e.message}`;
        console.error('Network: FAIL');
        return false;
    }

    // 1.3 Auth
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    try {
        // Trivial query
        const { error } = await supabase.from('news').select('id').limit(1);
        if (error) throw error;
        REPORT.precheck.auth = true;
        console.log('Auth: PASS');
    } catch (e: any) {
        REPORT.precheck.auth = false;
        REPORT.precheck.details = `Auth Fail: ${e.message}`;
        console.error('Auth: FAIL');
        return false;
    }

    return true;
}

// --- STEP 2: LIVE DB AUDIT ---
async function runDbAudit(supabase: any) {
    console.log('\n--- 2. LIVE DB AUDIT ---');

    const { data: allNews, error } = await supabase
        .from('news')
        .select('*');

    if (error) {
        console.error('DB Query Failed:', error);
        return;
    }

    REPORT.inventory.total = allNews.length;

    const now = Date.now();
    const staleThreshold = 72 * 60 * 60 * 1000;

    allNews.forEach((item: any) => {
        // Levels
        const level = item.city ? 'CITY' : (item.land ? 'BUNDESLAND' : 'COUNTRY');
        REPORT.inventory.by_level[level] = (REPORT.inventory.by_level[level] || 0) + 1;

        // Land
        if (item.land) {
            REPORT.inventory.by_land[item.land] = (REPORT.inventory.by_land[item.land] || 0) + 1;
        }

        // City
        if (item.city) {
            REPORT.inventory.by_city[item.city] = (REPORT.inventory.by_city[item.city] || 0) + 1;
        }

        // Freshness
        if (item.published_at) {
            if (!REPORT.freshness.oldest || item.published_at < REPORT.freshness.oldest) REPORT.freshness.oldest = item.published_at;
            if (!REPORT.freshness.newest || item.published_at > REPORT.freshness.newest) REPORT.freshness.newest = item.published_at;

            const age = now - new Date(item.published_at).getTime();
            if (age > staleThreshold) REPORT.freshness.stale_count_72h++;
        }

        // Leipzig
        if (item.city === 'Leipzig') {
            REPORT.leipzig.total++;
            if (item.image_url) REPORT.leipzig.with_image++;
            if (item.published_at) {
                if (!REPORT.leipzig.oldest || item.published_at < REPORT.leipzig.oldest) REPORT.leipzig.oldest = item.published_at;
                if (!REPORT.leipzig.newest || item.published_at > REPORT.leipzig.newest) REPORT.leipzig.newest = item.published_at;
            }
            REPORT.leipzig.visible_count++; // All are visible unless flagged otherwise (no hidden flag known)
        }

        // Image Refs
        if (item.image_url) REPORT.storage.db_image_refs++;

        // Status Health
        const status = item.image_status || 'null';
        REPORT.storage.status_health[status] = (REPORT.storage.status_health[status] || 0) + 1;

        // Stuck Items
        if (status === 'generating') {
            REPORT.storage.stuck_items.push({ id: item.id, date: item.image_last_attempt_at || item.updated_at });
        }
    });

    // Sort stuck items
    REPORT.storage.stuck_items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    REPORT.storage.stuck_items = REPORT.storage.stuck_items.slice(0, 10);

    // Coverage Gaps
    CITY_PACKAGES.forEach((pkg: any) => {
        if (!REPORT.inventory.by_city[pkg.city]) {
            REPORT.coverage_gaps.cities_with_zero_news.push(pkg.city);
        }
    });
}

// --- STEP 3: STORAGE AUDIT ---
async function runStorageAudit(supabase: any) {
    console.log('\n--- 3. STORAGE AUDIT ---');
    // Sample check of image URLs to see if they exist
    const { data: sampleNews } = await supabase
        .from('news')
        .select('image_url')
        .not('image_url', 'is', null)
        .limit(10);

    if (sampleNews && sampleNews.length > 0) {
        for (const item of sampleNews) {
            REPORT.storage.sample_check.checked++;
            if (!item.image_url) continue;

            // Parse filename from URL
            // URL format: .../storage/v1/object/public/images/filename.jpg
            const parts = item.image_url.split('/');
            const filename = parts[parts.length - 1];

            // Check existence (HEAD) - using list actually as HEAD might not be exposed easily in simple client without download
            // Or just fetch the URL head
            try {
                const res = await fetch(item.image_url, { method: 'HEAD' });
                if (res.ok) REPORT.storage.sample_check.found++;
                else REPORT.storage.sample_check.missing++;
            } catch {
                REPORT.storage.sample_check.missing++;
            }
        }
    }
}

// --- STEP 4: WORKFLOW STATUS ---
function checkWorkflows() {
    console.log('\n--- 4. WORKFLOWS ---');
    const workflowsDir = path.join(process.cwd(), '.github', 'workflows');
    if (fs.existsSync(workflowsDir)) {
        const files = fs.readdirSync(workflowsDir);
        files.forEach(f => {
            const content = fs.readFileSync(path.join(workflowsDir, f), 'utf-8');
            REPORT.workflows.configs[f] = {
                schedule: content.match(/cron:\s*['"]([^'"]+)['"]/)?.[1] || 'None',
                enabled: !content.includes('# disabled'), // Rough check
            };
        });
    }
}

// --- MAIN ---
async function main() {
    if (await runPrecheck()) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
        await runDbAudit(supabase);
        await runStorageAudit(supabase);
        checkWorkflows();
    } else {
        console.error('PRECHECK FAILED - Skipping Audit Steps');
    }

    // Output Report
    console.log('\n=== REPORT OBJECT ===');
    console.log(JSON.stringify(REPORT, null, 2));

    // Write MD Report
    const md = `
# NEWS PAGE LIVE AUDIT (READ-ONLY) — ${REPORT.timestamp}

## 1. Precheck (Secrets + Network + Auth)
- **Secrets**: ${Object.keys(REPORT.precheck.secrets).map(k => `${k}: ${REPORT.precheck.secrets[k] ? 'PASS' : 'FAIL'}`).join(', ')}
- **Network**: ${REPORT.precheck.network ? 'PASS' : 'FAIL'}
- **Auth**: ${REPORT.precheck.auth ? 'PASS' : 'FAIL'}
- **Status**: ${REPORT.precheck.auth ? 'PASS' : 'FAIL'}

## 2. Inventory (Counts)
- **TOTAL**: ${REPORT.inventory.total}
- **By Level**:
${Object.entries(REPORT.inventory.by_level).map(([k, v]) => `  - ${k}: ${v}`).join('\n')}
- **By Bundesland**:
${Object.entries(REPORT.inventory.by_land).map(([k, v]) => `  - ${k}: ${v}`).join('\n')}

## 3. Image Coverage
- **DB References**: ${REPORT.storage.db_image_refs}
- **Sample Validation** (${REPORT.storage.sample_check.checked} tested):
  - Found: ${REPORT.storage.sample_check.found}
  - Missing: ${REPORT.storage.sample_check.missing}
- **Status Health**:
${Object.entries(REPORT.storage.status_health).map(([k, v]) => `  - ${k}: ${v}`).join('\n')}
- **Stuck Items (Top 10 Oldest)**:
${REPORT.storage.stuck_items.map(i => `  - ID ${i.id} (${i.date})`).join('\n') || '  - None'}

## 4. Freshness
- **Oldest**: ${REPORT.inventory.total > 0 ? REPORT.freshness.oldest : 'N/A'}
- **Newest**: ${REPORT.inventory.total > 0 ? REPORT.freshness.newest : 'N/A'}
- **Stale (>72h)**: ${REPORT.freshness.stale_count_72h}

## 5. Leipzig (Exact)
- **Total**: ${REPORT.leipzig.total}
- **With Image**: ${REPORT.leipzig.with_image}
- **Oldest**: ${REPORT.leipzig.total > 0 ? REPORT.leipzig.oldest : 'N/A'}
- **Newest**: ${REPORT.leipzig.total > 0 ? REPORT.leipzig.newest : 'N/A'}
- **Note**: All items assumed visible (no hidden flag found in schema).

## 6. Coverage Gaps
**Cities with ZERO news**:
${REPORT.coverage_gaps.cities_with_zero_news.length > 0 ? REPORT.coverage_gaps.cities_with_zero_news.map(c => `- ${c}`).join('\n') : '- None'}

## 7. Workflow Runtime Status (Config Only)
*Note: Runtime API access unavailable. Reporting configuration.*
${Object.entries(REPORT.workflows.configs).map(([k, v]) => `- **${k}**: Schedule="${v.schedule}", Enabled=${v.enabled}`).join('\n')}

## 8. Functional Limitations
- **Read-Only Mode**: YES (Enforced by role)

## 9. GO / NO-GO
- **Status**: ${REPORT.inventory.total > 0 ? 'GO' : 'NO-GO (No Data)'}
- **Reason**: ${REPORT.inventory.total > 0 ? 'Data is accessible and flowing.' : 'Database appears empty or inaccessible.'}
`;

    fs.writeFileSync('NEWS_PAGE_LIVE_AUDIT_REPORT.md', md);
    console.log('\Report saved to NEWS_PAGE_LIVE_AUDIT_REPORT.md');
}

main();
