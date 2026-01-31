import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Defer client creation or make it robust
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// If keys are missing, we can't create a valid client. 
// But we shouldn't crash at the top level if we want to log the error inside the function.
// Actually, createClient might throw if URL is empty.
const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null as any;
// We handle the null check inside runAutoHealer logic (added in previous step)


export async function runAutoHealer() {
    console.log('🚑 Starting Auto-Healer Scan...');

    // 0. Safety Check
    if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.warn('⚠️ Missing Supabase credentials. Skipping Auto-Healer.');
        return; // Exit gracefully instead of crashing
    }

    // 1. GLOBAL SYSTEM CHECK: Is the content fresh?
    // Determine if the *latest* news item in the pool is too old (> 24h).
    // If so, it suggests the Orchestrator/Scraper is down.
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
            // Potential Action: Trigger webhook, send email, or run fallback scraper?
            // For now, log error to 'system_errors' so it's visible in DB
            await supabase.from('system_errors').insert({
                user_id: 'SYSTEM',
                error_code: 'SYSTEM_STALE',
                message: `Feed is stale (${hoursSinceUpdate.toFixed(1)}h)`,
                severity: 'CRITICAL',
                status: 'OPEN'
            });
        } else {
            console.log(`✅ System Healthy. Last news: ${hoursSinceUpdate.toFixed(1)}h ago.`);
        }
    }

    // 2. Fetch OPEN Client Errors
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

async function tryFixError(err: any) {
    console.log(`🔧 Fixing Issue ${err.error_code} for User ${err.user_id}...`);
    let fixed = false;

    try {
        // --- STRATEGY 1: Corrupted State (JSON Error) ---
        if (err.error_code === 'STATE_CORRUPTION') {
            // ACTION: Reset User State to defaults
            await supabase
                .from('user_news_states')
                .delete()
                .eq('user_id', err.user_id);

            fixed = true;
            console.log(`   -> Corrupted state wiped. User will start fresh.`);
        }

        // --- STRATEGY 2: Feed Empty (Stuck in 0) ---
        else if (err.error_code === 'FEED_EMPTY') {
            // ACTION: Force delete 'visibleFeed' in DB so client refills it
            // We read the state first
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

        // --- MARK AS FIXED ---
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

// Export only, let orchestrator call it
// runAutoHealer();
