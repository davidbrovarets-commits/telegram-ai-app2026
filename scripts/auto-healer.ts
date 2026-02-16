import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { assertMutationAllowed, isDryRun } from './lib/mutation-guard';
import { checkAndFixQuality } from './agents/quality-monitor';

dotenv.config();

// Defer client creation or make it robust
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null as any;

export async function runAutoHealer() {
    console.log('🚑 Starting Auto-Healer Scan...');

    // 0. Safety Check
    if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.warn('⚠️ Missing Supabase credentials. Skipping Auto-Healer.');
        return;
    }

    // 0.1 DRY RUN GUARD
    if (isDryRun()) {
        console.log('🚑 [DRY_RUN] Auto-Healer: auto-healer in read-only mode');
        // We do NOT return here, we proceed to read-only checks, 
        // BUT we guard writes below.
    }

    // 1. GLOBAL SYSTEM CHECK: Is the content fresh?
    const { data: latestNews } = await supabase
        .from('news')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (latestNews) {
        const lastUpdate = new Date(latestNews.created_at).getTime();
        const now = Date.now();
        const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60);

        if (hoursSinceUpdate > 24) {
            console.error(`🚨 CRITICAL: System stale! Last news was ${hoursSinceUpdate.toFixed(1)} hours ago.`);

            if (isDryRun()) {
                console.log('[DRY_RUN] Would insert SYSTEM_STALE error.');
            } else {
                assertMutationAllowed('auto-healer:insert-system-error');
                await supabase.from('system_errors').insert({
                    user_id: 'SYSTEM',
                    error_code: 'SYSTEM_STALE',
                    message: `Feed is stale (${hoursSinceUpdate.toFixed(1)}h)`,
                    severity: 'CRITICAL',
                    status: 'OPEN'
                });
            }
        } else {
            console.log(`✅ System Healthy. Last news: ${hoursSinceUpdate.toFixed(1)}h ago.`);
        }
    }

    // 3. RUN SUB-TASKS
    await runDatabaseCleaner();
    await checkSourceHealth();
    // await runAIReviver(); // Level 3 (commented out in original?)
    await runQualityMonitor();

    // 4. Fetch OPEN Client Errors
    const { data: errors, error } = await supabase
        .from('system_errors')
        .select('*')
        .eq('status', 'OPEN')
        .limit(50);

    if (error || !errors || errors.length === 0) {
        console.log('✅ No open client errors found.');
        return;
    }

    console.log(`⚠️ Found ${errors.length} open issues. Attempting fixes...`);

    for (const err of errors) {
        await tryFixError(err);
    }
}

// --- LEVEL 1: DATABASE CLEANER 🧹 ---
async function runDatabaseCleaner() {
    console.log('🧹 [Level 1] Running Database Cleaner...');
    const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    if (isDryRun()) {
        console.log('   [DRY_RUN] Skipping delete.');
        return;
    }

    assertMutationAllowed('auto-healer:clean-db');
    const { count, error } = await supabase
        .from('news')
        .delete({ count: 'exact' })
        .lt('created_at', THIRTY_DAYS_AGO)
        .neq('status', 'ARCHIVED');

    if (error) console.error('   ❌ Failed to clean DB:', error.message);
    else console.log(`   ✅ Cleaned ${count || 0} old news items.`);
}

// --- LEVEL 2: DETECTIVE (SOURCE HEALTH) 🕵️‍♂️ ---
async function checkSourceHealth() {
    console.log('🕵️‍♂️ [Level 2] Inspecting Source Health...');

    const { data: cities } = await supabase
        .from('news')
        .select('city')
        .not('city', 'is', null)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false });

    if (!cities) return;

    const uniqueCities = [...new Set(cities.map((c: { city: string }) => c.city))];
    const NOW = Date.now();
    let issuesFound = 0;

    for (const city of uniqueCities) {
        if (!city) continue;

        const { data: latest } = await supabase
            .from('news')
            .select('created_at')
            .eq('city', city)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (latest) {
            const hours = (NOW - new Date(latest.created_at).getTime()) / (1000 * 60 * 60);
            if (hours > 48) {
                console.warn(`   ⚠️ City '${city}' is STALE! (${hours.toFixed(1)}h old)`);

                if (isDryRun()) {
                    console.log('[DRY_RUN] Would insert system error.');
                } else {
                    assertMutationAllowed('auto-healer:insert-system-error');
                    await supabase.from('system_errors').insert({
                        user_id: 'SYSTEM',
                        error_code: 'SOURCE_STALE',
                        message: `City ${city} has no news for ${hours.toFixed(1)}h`,
                        severity: 'WARNING',
                        status: 'OPEN'
                    });
                }
                issuesFound++;
            }
        }
    }

    if (issuesFound === 0) console.log(`   ✅ All ${uniqueCities.length} active cities are fresh (<48h).`);
    else console.log(`   ⚠️ Found ${issuesFound} stale cities.`);
}

// --- LEVEL 4: QUALITY MONITOR 🧐 ---
async function runQualityMonitor() {
    console.log('🧐 [Level 4] Running Quality Monitor (Tone & Format)...');

    const { data: recentNews } = await supabase
        .from('news')
        .select('*')
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false })
        .limit(20);

    if (!recentNews) return;

    let issuesFixed = 0;
    for (const item of recentNews) {
        const fix = await checkAndFixQuality({
            id: item.id,
            title: item.title_en || item.title,
            content: item.summary_en || item.content || ''
        });

        if (fix) {
            if (isDryRun()) {
                console.log(`   [DRY_RUN] Would update quality for item ${fix.original_id}`);
            } else {
                assertMutationAllowed('auto-healer:quality-update');
                await supabase
                    .from('news')
                    .update({ summary_en: fix.new_summary })
                    .eq('id', fix.original_id);

                console.log(`      ✅ Fixed quality for item ${fix.original_id}`);
            }
            issuesFixed++;
        }
    }
    if (issuesFixed > 0) console.log(`   ✨ Improved quality of ${issuesFixed} items.`);
    else console.log(`   ✅ Content quality looks good.`);
}

async function tryFixError(err: any) {
    console.log(`🔧 Fixing Issue ${err.error_code} for User ${err.user_id}...`);

    if (isDryRun()) {
        console.log('   [DRY_RUN] Skipping fix execution.');
        return;
    }

    assertMutationAllowed('auto-healer:fix-error');

    let fixed = false;

    try {
        if (err.error_code === 'STATE_CORRUPTION') {
            await supabase
                .from('user_news_states')
                .delete()
                .eq('user_id', err.user_id);

            fixed = true;
            console.log(`   -> Corrupted state wiped. User will start fresh.`);
        }
        else if (err.error_code === 'FEED_EMPTY') {
            const { data: userState } = await supabase
                .from('user_news_states')
                .select('state')
                .eq('user_id', err.user_id)
                .single();

            if (userState && userState.state) {
                const cleanState = { ...userState.state, visibleFeed: [] };
                await supabase
                    .from('user_news_states')
                    .update({ state: cleanState })
                    .eq('user_id', err.user_id);

                fixed = true;
                console.log(`   -> Feed cleared. Client will force refill on next load.`);
            }
        }

        if (fixed) {
            await supabase
                .from('system_errors')
                .update({ status: 'FIXED' })
                .eq('id', err.id);
            console.log(`✅ Issue ${err.id} marked as FIXED.`);
        } else {
            console.log(`❌ Could not auto-fix ${err.error_code}. Requires human intervention.`);
        }

    } catch (e) {
        console.error(`💥 Failed to fix ${err.id}:`, e);
    }
}
