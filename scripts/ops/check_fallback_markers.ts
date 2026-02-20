import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
    // 1) Check for persisted fallback markers
    const { data: fallbackRows, error: e1 } = await sb
        .from('news')
        .select('id, created_at, link, title, uk_summary')
        .or('title.ilike.%[UA Fallback]%,uk_summary.ilike.%[UA Fallback]%')
        .order('created_at', { ascending: false })
        .limit(5);

    console.log('=== ROWS WITH [UA Fallback] IN DB ===');
    if (e1) { console.log('Error:', e1.message); }
    else if (!fallbackRows || fallbackRows.length === 0) {
        console.log('NONE FOUND — marker not persisted in DB.');
    } else {
        for (const r of fallbackRows) {
            console.log('---');
            console.log('id:', r.id);
            console.log('created_at:', r.created_at);
            console.log('link:', r.link?.substring(0, 80));
            console.log('title (first 100):', r.title?.substring(0, 100));
            console.log('uk_summary (first 100):', r.uk_summary?.substring(0, 100));
        }
    }

    // 2) Also check [UA Mock]
    const { data: mockRows, error: e2 } = await sb
        .from('news')
        .select('id, created_at, title, uk_summary')
        .or('title.ilike.%[UA Mock]%,uk_summary.ilike.%[UA Mock]%')
        .order('created_at', { ascending: false })
        .limit(3);

    console.log('\n=== ROWS WITH [UA Mock] IN DB ===');
    if (e2) { console.log('Error:', e2.message); }
    else if (!mockRows || mockRows.length === 0) {
        console.log('NONE FOUND.');
    } else {
        for (const r of mockRows) {
            console.log('---');
            console.log('id:', r.id);
            console.log('title (first 100):', r.title?.substring(0, 100));
            console.log('uk_summary (first 100):', r.uk_summary?.substring(0, 100));
        }
    }

    // 3) Recent 3 rows for comparison
    const { data: recent } = await sb
        .from('news')
        .select('id, created_at, title, uk_summary')
        .order('created_at', { ascending: false })
        .limit(3);

    console.log('\n=== 3 MOST RECENT ROWS (for comparison) ===');
    for (const r of (recent || [])) {
        console.log('---');
        console.log('id:', r.id);
        console.log('created_at:', r.created_at);
        console.log('title (first 100):', r.title?.substring(0, 100));
        console.log('uk_summary (first 100):', r.uk_summary?.substring(0, 100));
    }

    process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
