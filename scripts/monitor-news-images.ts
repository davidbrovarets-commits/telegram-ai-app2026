import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// --- CONFIGURATION ---
const MAX_GENERATION_ATTEMPTS = 3; // Sync with imageStatus.ts

// Thresholds
const THRESHOLD_FAIL_STUCK = 3;
const THRESHOLD_FAIL_RECENT = 10;
const THRESHOLD_WARN_FAIL_RECENT = 3;
const THRESHOLD_WARN_HIGH_ATTEMPTS = 5;
const THRESHOLD_FAIL_CONTRACT_RATE = 0.5; // 50%
const THRESHOLD_WARN_CONTRACT_RATE = 0.8; // 80%

// Contract Tokens
const MANDATORY_LIGHTING_TOKENS = [
    'cinematic lighting', 'rim light', 'chiaroscuro', 'natural diffused light'
];
const MANDATORY_REALISM_TOKENS = [
    'film grain', 'chromatic aberration', 'dust particles', 'subtle motion blur'
];
const MANDATORY_LENS_TOKENS = ['35mm lens', '50mm lens'];
const MANDATORY_APERTURE_TOKENS = ['f/2.8 aperture', 'f/8 aperture'];

const NEGATIVE_SNIPPET = "Exclude: Blurry. Low quality."; // Basic check for presence

// --- SETUP ---
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- HELPERS ---
function log(msg: string) {
    console.log(msg);
}

function warn(msg: string) {
    console.log(`⚠️  ${msg}`);
}

function fail(msg: string) {
    console.log(`❌ ${msg}`);
}

async function main() {
    log('\n=== NEWS IMAGES MONITOR ===\n');
    let exitCode = 0;
    let warnings = 0;
    let failures = 0;

    try {
        // 1. Status Counts
        log('--- 1. Status Counts ---');
        const { data: statusCounts, error: statusErr } = await supabase
            .from('news')
            .select('image_status')
            .csv(); // HACK: Group by not supported easily in simple select without RPC, using manual aggregation

        if (statusErr) throw statusErr;

        // Manual grouping since we can't do GROUP BY easily with simple client usage usually, 
        // actually likely safer to just fetch all statuses or use rpc if available. 
        // OR just use .select with distinct? No.
        // Let's use separate count queries for cleaner code or just fetch generic stats.
        // Optimizing: We can't query "GROUP BY" directly via SDK standard builder easily without .rpc.
        // We will do 4 distinct count queries to be safe and simple.

        const statuses = ['placeholder', 'generating', 'generated', 'failed'];
        const counts: Record<string, number> = {};

        for (const s of statuses) {
            const { count } = await supabase.from('news').select('*', { count: 'exact', head: true }).eq('image_status', s);
            counts[s] = count || 0;
            log(`   ${s.padEnd(12)}: ${counts[s]}`);
        }


        // 2. Stuck Generating (> 45m)
        log('\n--- 2. Stuck Generating (> 45m) ---');
        const fortyFiveMinsAgo = new Date(Date.now() - 45 * 60 * 1000).toISOString();
        const { data: stuckItems, error: stuckErr } = await supabase
            .from('news')
            .select('id, created_at, image_generation_attempts')
            .eq('image_status', 'generating')
            .lt('created_at', fortyFiveMinsAgo)
            .limit(50);

        if (stuckErr) throw stuckErr;

        const stuckCount = stuckItems?.length || 0;
        if (stuckCount > 0) {
            stuckItems?.forEach(i => log(`   ID ${i.id}: Updated ${i.created_at}, Attempts: ${i.image_generation_attempts}`));
        } else {
            log('   None.');
        }

        if (stuckCount >= THRESHOLD_FAIL_STUCK) {
            fail(`Stuck items count (${stuckCount}) exceeds FAIL threshold (${THRESHOLD_FAIL_STUCK})`);
            failures++;
        }


        // 3. Recent Failures (Last 3h)
        log('\n--- 3. Recent Failures (Last 3h) ---');
        const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
        const { count: recentFailCount, error: recentFailErr } = await supabase
            .from('news')
            .select('*', { count: 'exact', head: true })
            .eq('image_status', 'failed')
            .gte('created_at', threeHoursAgo);

        if (recentFailErr) throw recentFailErr;

        log(`   Count: ${recentFailCount}`);
        if ((recentFailCount || 0) >= THRESHOLD_FAIL_RECENT) {
            fail(`Recent failures (${recentFailCount}) exceeds FAIL threshold (${THRESHOLD_FAIL_RECENT})`);
            failures++;
        } else if ((recentFailCount || 0) >= THRESHOLD_WARN_FAIL_RECENT) {
            warn(`Recent failures (${recentFailCount}) exceeds WARN threshold (${THRESHOLD_WARN_FAIL_RECENT})`);
            warnings++;
        }


        // 4. High Attempts (>= MAX-1) in Last 24h
        log('\n--- 4. High Attempts (Last 24h) ---');
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: highAttemptItems, error: highAttemptErr } = await supabase
            .from('news')
            .select('id, image_generation_attempts, image_status')
            .gte('image_generation_attempts', MAX_GENERATION_ATTEMPTS - 1)
            .gte('created_at', twentyFourHoursAgo)
            .limit(50);

        if (highAttemptErr) throw highAttemptErr;

        const highAttemptCount = highAttemptItems?.length || 0;
        if (highAttemptCount > 0) {
            highAttemptItems?.slice(0, 10).forEach(i => log(`   ID ${i.id}: Attempts ${i.image_generation_attempts} (${i.image_status})`));
            if (highAttemptCount > 10) log(`   ... and ${highAttemptCount - 10} more.`);
        } else {
            log('   None.');
        }

        if (highAttemptCount >= THRESHOLD_WARN_HIGH_ATTEMPTS) {
            warn(`High attempt count (${highAttemptCount}) exceeds WARN threshold (${THRESHOLD_WARN_HIGH_ATTEMPTS})`);
            warnings++;
        }


        // 5. Prompt Contract Sanity (Last 25 generated)
        log('\n--- 5. Prompt Contract Sanity (Latest 25) ---');
        const { data: recentPrompts, error: promptErr } = await supabase
            .from('news')
            .select('id, image_prompt')
            .eq('image_status', 'generated')
            .eq('image_source_type', 'imagen')
            .not('image_prompt', 'is', null)
            .order('created_at', { ascending: false })
            .limit(25);

        if (promptErr) throw promptErr;

        let passed = 0;
        let checked = 0;

        if (recentPrompts && recentPrompts.length > 0) {
            for (const item of recentPrompts) {
                checked++;
                const p = (item.image_prompt || '').toLowerCase();
                const violations: string[] = [];

                // Checks
                if (!p.includes('exclude:')) violations.push('Missing "Exclude:"');

                const hasLighting = MANDATORY_LIGHTING_TOKENS.some(t => p.includes(t));
                if (!hasLighting) violations.push('Missing Lighting');

                const realismCount = MANDATORY_REALISM_TOKENS.filter(t => p.includes(t)).length;
                if (realismCount < 1 || realismCount > 2) violations.push(`Realism count ${realismCount} (want 1-2)`);

                const hasLens = MANDATORY_LENS_TOKENS.some(t => p.includes(t));
                if (!hasLens) violations.push('Missing Lens');

                const hasAperture = MANDATORY_APERTURE_TOKENS.some(t => p.includes(t));
                if (!hasAperture) violations.push('Missing Aperture');

                if (violations.length === 0) {
                    passed++;
                } else {
                    log(`   ID ${item.id} FAIL: ${violations.join(', ')}`);
                }
            }

            const passRate = checked > 0 ? passed / checked : 1.0;
            log(`   Pass Rate: ${(passRate * 100).toFixed(1)}% (${passed}/${checked})`);

            if (passRate < THRESHOLD_FAIL_CONTRACT_RATE) {
                fail(`Contract pass rate < ${(THRESHOLD_FAIL_CONTRACT_RATE * 100)}%`);
                failures++;
            } else if (passRate < THRESHOLD_WARN_CONTRACT_RATE) {
                warn(`Contract pass rate < ${(THRESHOLD_WARN_CONTRACT_RATE * 100)}%`);
                warnings++;
            }

        } else {
            log('   No recent Imagen items to check.');
        }


        // 6. Static Aspect Ratio Check
        log('\n--- 6. Static Code Check (Aspect Ratio) ---');
        const scriptPath = path.join(process.cwd(), 'scripts', 'generate_news_banners.ts');
        if (fs.existsSync(scriptPath)) {
            const content = fs.readFileSync(scriptPath, 'utf-8');
            if (content.includes('aspectRatio: "4:3"') || content.includes('"aspectRatio":"4:3"')) {
                log('   ✅ "aspectRatio": "4:3" found in code.');
            } else {
                fail('   ❌ "aspectRatio": "4:3" NOT found in generate_news_banners.ts');
                failures++;
            }
        } else {
            warn('   ⚠️ generate_news_banners.ts not found (skipping check).');
        }


        // Summary
        log('\n=== SUMMARY ===');
        log(`Failures: ${failures}`);
        log(`Warnings: ${warnings}`);

        if (failures > 0) {
            log('\n❌ MONITOR FAILED');
            process.exit(1);
        } else {
            log('\n✅ MONITOR PASSED');
            process.exit(0);
        }

    } catch (err: any) {
        console.error('\n❌ FATAL ERROR:', err.message);
        process.exit(1);
    }
}

main();
