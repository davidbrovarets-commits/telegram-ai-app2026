import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { execSync } from 'child_process';
import { releaseImageLock } from '../lib/imageStatus';

// --- CONFIGURATION ---
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const INSPECTOR_ALLOW_LOCK_RELEASE = process.env.INSPECTOR_ALLOW_LOCK_RELEASE === 'true';
const INSPECTOR_LOCK_STUCK_MINUTES = parseInt(process.env.INSPECTOR_LOCK_STUCK_MINUTES || '45', 10);
const CRITICAL_STUCK_COUNT = 3;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const TABLE = 'news';

interface Incident {
    severity: 'P0' | 'P1' | 'P2' | 'P3';
    message: string;
    fix_action?: string;
    evidence?: any;
}

interface Metrics {
    generated_24h: number;
    failed_24h: number;
    stuck_found: number;
    stuck_released: number;
    attempts_near_cap_24h: number;
}

const REPORT: {
    status: 'PASS' | 'WARN' | 'FAIL';
    checks: Record<string, boolean>;
    incidents: Incident[];
    metrics: Metrics;
    timestamp: string;
} = {
    status: 'PASS',
    checks: {},
    incidents: [],
    metrics: {
        generated_24h: 0,
        failed_24h: 0,
        stuck_found: 0,
        stuck_released: 0,
        attempts_near_cap_24h: 0
    },
    timestamp: new Date().toISOString()
};

async function checkStatusCounts() {
    console.log('--- Checking Status Counts ---');
    const statuses = ['placeholder', 'generating', 'generated', 'failed'];
    for (const s of statuses) {
        const { count, error } = await supabase.from(TABLE).select('id', { count: 'exact', head: true }).eq('image_status', s);

        if (error) {
            console.error(`DB Error counting status ${s}:`, error);
            REPORT.checks['status_counts'] = false;
            REPORT.incidents.push({ severity: 'P0', message: `DB Error counting status ${s}`, evidence: error });
            REPORT.status = 'FAIL';
            return;
        }
        console.log(`   ${s}: ${count}`);
    }
    REPORT.checks['status_counts'] = true;
}

async function checkAndFixStuckItems() {
    console.log(`--- Checking Stuck Items (> ${INSPECTOR_LOCK_STUCK_MINUTES}m) ---`);
    const cutoff = new Date(Date.now() - INSPECTOR_LOCK_STUCK_MINUTES * 60 * 1000).toISOString();

    // Use image_last_attempt_at for stuck detection
    const { data: stuckItems, error } = await supabase
        .from(TABLE)
        .select('id, image_status, image_last_attempt_at, image_generation_attempts')
        .eq('image_status', 'generating')
        .lt('image_last_attempt_at', cutoff);

    if (error) {
        REPORT.incidents.push({ severity: 'P0', message: 'DB Error checking stuck items', evidence: error });
        REPORT.checks['stuck_check'] = false;
        return;
    }

    REPORT.metrics.stuck_found = stuckItems?.length || 0;
    REPORT.checks['stuck_check'] = true;

    if (stuckItems && stuckItems.length > 0) {
        console.log(`Found ${stuckItems.length} stuck items.`);

        if (INSPECTOR_ALLOW_LOCK_RELEASE) {
            console.log('AUTOFIX ENABLED: Releasing locks...');
            let released = 0;
            for (const item of stuckItems) {
                try {
                    await releaseImageLock(supabase, item.id, 'inspector-autofix');
                    released++;
                } catch (e) {
                    REPORT.incidents.push({ severity: 'P1', message: `Failed to release lock for ID ${item.id}`, evidence: e });
                }
            }
            REPORT.metrics.stuck_released = released;
            REPORT.incidents.push({
                severity: 'P1',
                message: `Auto-released ${released}/${stuckItems.length} stuck items`,
                fix_action: 'Locks released'
            });
        } else {
            console.log('AUTOFIX DISABLED: Reporting only.');
            REPORT.incidents.push({
                severity: 'P1',
                message: `Found ${stuckItems.length} stuck items (generating > ${INSPECTOR_LOCK_STUCK_MINUTES}m)`,
                fix_action: 'Enable INSPECTOR_ALLOW_LOCK_RELEASE=true to autofix'
            });
            // Mark as potential failure if critical mass
            if (stuckItems.length >= CRITICAL_STUCK_COUNT) REPORT.status = 'FAIL'; // Elevate status
        }
    } else {
        console.log('No stuck items found.');
    }
}

async function collectMetrics24h() {
    console.log('--- Collecting 24h Metrics ---');
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Generated 24h (based on image_generated_at or fallback to updated_at if missing, but preferably created_at + status)
    // Note: image_generated_at exists in lib/imageStatus.ts update, checking DB schema might be needed but assuming standard fields.
    // We'll use updated_at/created_at proxy if specific field missing, but let's try to assume robust queries.
    // 'image_generated_at' logic was added in existing code? imageStatus.ts uses it.

    // Generated
    const { count: genCount } = await supabase
        .from(TABLE)
        .select('id', { count: 'exact', head: true })
        .eq('image_status', 'generated')
        // We can't easily filter by "when it was generated" without a specific column. 
        // imageStatus.ts updates 'image_generated_at'. Let's use that if available, else skip time filter for now or use updated_at (risky).
        // Let's assume 'created_at' for NEW items generated in last 24h as a proxy for "throughput check".
        .gte('created_at', twentyFourHoursAgo);

    REPORT.incidents.push({
        severity: 'P3',
        message: 'generated_24h metric uses created_at proxy (not image_generated_at)',
        fix_action: 'If image_generated_at exists, switch filter to that column for true throughput.'
    });

    REPORT.metrics.generated_24h = genCount || 0;

    // Failed 24h
    const { count: failCount } = await supabase
        .from(TABLE)
        .select('id', { count: 'exact', head: true })
        .eq('image_status', 'failed')
        .gte('image_last_attempt_at', twentyFourHoursAgo);

    REPORT.metrics.failed_24h = failCount || 0;

    // High Attempts
    const MAX_ATTEMPTS = 3;
    const { count: capCount } = await supabase
        .from(TABLE)
        .select('id', { count: 'exact', head: true })
        .gte('image_generation_attempts', MAX_ATTEMPTS - 1)
        .gte('image_last_attempt_at', twentyFourHoursAgo);

    REPORT.metrics.attempts_near_cap_24h = capCount || 0;

    REPORT.checks['metrics_24h'] = true;
}

function runGeneratorDryRun() {
    console.log('--- Running Generator Dry Run ---');
    try {
        // Enforce safe env vars
        const schema = {
            ...process.env,
            NEWS_IMAGES_DRY_RUN_PROMPT: 'true',
            NEWS_IMAGES_BATCH_SIZE: '1'
        };

        execSync('npx tsx scripts/generate_news_banners.ts', {
            env: schema,
            stdio: 'inherit',
            timeout: 60000 // 1 min timeout
        });
        REPORT.checks['generator_dry_run'] = true;
    } catch (e: any) {
        console.error('Generator Dry Run Failed:', e.message);
        REPORT.checks['generator_dry_run'] = false;
        REPORT.incidents.push({ severity: 'P0', message: 'Generator Dry Run Failed', evidence: e.message });
        REPORT.status = 'FAIL';
    }
}

async function main() {
    console.log('INSPECTOR_REPORT_START');

    try {
        await checkStatusCounts();
        if (REPORT.status === 'FAIL') {
            console.log(JSON.stringify(REPORT, null, 2));
            console.log('INSPECTOR_REPORT_END');
            process.exit(1);
        }
        await checkAndFixStuckItems();
        await collectMetrics24h();
        runGeneratorDryRun();
    } catch (e: any) {
        console.error('Fatal Inspector Error:', e);
        REPORT.status = 'FAIL';
        REPORT.incidents.push({ severity: 'P0', message: 'Inspector Fatal Error', evidence: e.message });
    }

    console.log(JSON.stringify(REPORT, null, 2));
    console.log('INSPECTOR_REPORT_END');

    // GitHub Job Summary
    if (process.env.GITHUB_STEP_SUMMARY) {
        const summary = `
## 🕵️ AI Inspector Report

**Status:** ${REPORT.status === 'PASS' ? '✅ PASS' : REPORT.status === 'WARN' ? '⚠️ WARN' : '❌ FAIL'}
**Timestamp:** ${REPORT.timestamp}
**AutoFix:** ${INSPECTOR_ALLOW_LOCK_RELEASE ? 'Enabled (L0)' : 'Disabled'}

### 📊 24h Metrics
| Metric | Value |
|--------|-------|
| Generated | ${REPORT.metrics.generated_24h} |
| Failed | ${REPORT.metrics.failed_24h} |
| Stuck Found | ${REPORT.metrics.stuck_found} |
| Stuck Released | ${REPORT.metrics.stuck_released} |
| Near Cap (Attempts) | ${REPORT.metrics.attempts_near_cap_24h} |

### 🚨 Incidents
${REPORT.incidents.length > 0 ? REPORT.incidents.map(i => `- **${i.severity}**: ${i.message} ${i.fix_action ? `(Fix: ${i.fix_action})` : ''}`).join('\n') : '*No incidents detected.*'}

### ✅ Checks
${Object.entries(REPORT.checks).map(([k, v]) => `- ${k}: ${v ? 'OK' : 'FAIL'}`).join('\n')}
`;
        fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
    }

    if (REPORT.status === 'FAIL') process.exit(1);
    process.exit(0);
}

main();
