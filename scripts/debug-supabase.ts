
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
    console.log('Testing Supabase Query...');

    const usedIds = [1, 2, 3];
    const usedIdsString = `(${usedIds.join(',')})`;

    console.log('Trying String syntax:', usedIdsString);

    // Test 1: Simulate FeedManager Logic
    // Fetch top 100 global news
    const { data: globalNews, error: error1 } = await supabase
        .from('news')
        .select('*')
        .in('status', ['POOL', 'ACTIVE'])
        .not('type', 'is', null)
        .order('priority', { ascending: false })
        .limit(100);

    if (error1) {
        console.error('Fetch FAILED:', error1.message);
        return;
    }

    console.log(`Fetched ${globalNews?.length} global news items.`);

    // Simulate "Bayern" user
    const userLand = 'Bayern';
    const userCity = 'München';

    const filtered = globalNews.filter(item => {
        if (!item.scope) return true;
        if (item.scope === 'DE') return true;
        if (item.scope === 'LAND') return item.land === userLand;
        if (item.scope === 'CITY') return item.city === userCity;
        return true;
    });

    console.log(`User (Bayern/München) would see: ${filtered.length} items`);

    // Show what was filtered OUT (Sample)
    const rejected = globalNews.filter(n => !filtered.includes(n));
    if (rejected.length > 0) {
        console.log('Sample Rejected Items (Top 3):');
        rejected.slice(0, 3).forEach(n => console.log(`- [${n.scope}] ${n.land} / ${n.city} (ID: ${n.id})`));
    }

    // Show what REMAINED (Sample)
    if (filtered.length > 0) {
        console.log('Sample Accepted Items (Top 3):');
        filtered.slice(0, 3).forEach(n => console.log(`- [${n.scope}] ${n.land} / ${n.city} (ID: ${n.id})`));
    } else {
        console.log('!!! NO ITEMS REMAINED FOR THIS USER !!!');
        console.log('This confirms the hypothesis: Top 100 global news are deemed irrelevant for this user.');
    }


}

testQuery();
