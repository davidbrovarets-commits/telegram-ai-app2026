
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runVerification() {
    console.log('=== DB VERIFICATION ===');

    // Q1: No generated without URL
    const { count: badGenerated, error: err1 } = await supabase
        .from('news')
        .select('*', { count: 'exact', head: true })
        .eq('image_status', 'generated')
        .is('image_url', null);

    if (err1) throw err1;
    console.log(`Q1: Bad Generated (status='generated' but no URL): ${badGenerated} (Expect: 0)`);
    if (badGenerated !== 0) console.error('❌ Q1 FAILED'); else console.log('✅ Q1 PASS');

    // Q3: Active items must be image-ready
    // Note: This matches the product rule filter we added
    const { count: badActive, error: err3 } = await supabase
        .from('news')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ACTIVE')
        .or('image_status.neq.generated,image_url.is.null');

    if (err3) throw err3;
    console.log(`Q3: Bad Active (ACTIVE but not fully generated): ${badActive} (Expect: 0)`);
    if (badActive !== 0) console.error('❌ Q3 FAILED'); else console.log('✅ Q3 PASS');

    // Q4: Retry Sanity
    const { data: maxAttemptsData, error: err4 } = await supabase
        .from('news')
        .select('image_generation_attempts')
        .order('image_generation_attempts', { ascending: false })
        .limit(1);

    if (err4) throw err4;
    const maxAttempts = maxAttemptsData?.[0]?.image_generation_attempts || 0;
    console.log(`Q4: Max Attempts observed: ${maxAttempts}`);
    if (maxAttempts > 50) console.warn('⚠️ High attempt count detected'); else console.log('✅ Q4 PASS');

    console.log('\n=== API VERIFICATION (serve-feed) ===');

    // Invoke Edge Function
    const { data: feedData, error: fnError } = await supabase.functions.invoke('serve-feed', {
        body: {
            city: "Leipzig",
            land: "Sachsen",
            page: 0,
            limit: 20
        }
    });

    if (fnError) {
        console.error('❌ API Call Failed:', fnError);
    } else {
        const feed = feedData.feed || [];
        console.log(`API returned ${feed.length} items`);

        let badFeedItems = 0;
        feed.forEach((item: any) => {
            if (!item.image_url) {
                console.error(`❌ Item ${item.id} missing image_url`);
                badFeedItems++;
            }
        });

        if (badFeedItems === 0) console.log('✅ API Feedback: All items have images');
        else console.error(`❌ API Verification FAILED: ${badFeedItems} items missing images`);
    }
}

runVerification().catch(console.error);
