import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // MUST use Service Role to fix other users' data
);

export async function runAutoHealer() {
    console.log('🚑 Starting Auto-Healer Scan...');

    // 1. Fetch OPEN errors
    const { data: errors, error } = await supabase
        .from('system_errors')
        .select('*')
        .eq('status', 'OPEN')
        .limit(50);

    if (error || !errors || errors.length === 0) {
        console.log('✅ No open errors found. System healthy.');
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
