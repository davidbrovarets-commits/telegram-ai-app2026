
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runHealthCheck() {
    console.log('--- DB HEALTH CHECK START ---\n');

    // 1. Inserted per hour (last 24h)
    console.log('1. Inserts per hour (last 24h):');
    const { data: insertsPerHour, error: error1 } = await supabase.rpc('exec_sql', {
        sql: `
      SELECT
        date_trunc('hour', created_at) AS hour,
        count(*) AS inserted
      FROM public.news
      WHERE created_at >= now() - interval '24 hours'
      GROUP BY 1
      ORDER BY 1 DESC;
    `
    });

    // Fallback if RPC fails (likely will if returns void/text differently, but let's try direct query if RPC is not an option or restricted. 
    // Actually, wait, the user instructions say "In Supabase SQL editor".
    // I cannot run SQL editor directly. I must use what I have.
    // I have `exec_sql` RPC which I verified earlier.
    // Let's assume RPC works for returning data.
    // If RPC is void, I need another way. 
    // Wait, I used RPC verify-cr008 which returned null. 
    // I should try to use standard PostgREST queries where possible to avoid RPC issues if I can.
    // Aggregates are hard with standard client without views.
    // I will try RPC first, but if it fails, I might need to fetch raw data and aggregate in JS (expensive but possible for 24h).
    // actually, `rpc` might return data if the function is defined `returns table`. 
    // Use `scripts/inspect-news-state.ts` as template? No, that just selected rows.

    // OPTION: We previously found `exec_sql` returned null. It might be `RETURNS VOID`.
    // If so, I cannot get results from it.

    // ALTERNATIVE: Use `supabase.from('news').select(...)` and do client-side aggregation?
    // 24h of news might be ~1000 items? That's fine.

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: newsItems, error: fetchError } = await supabase
        .from('news')
        .select('id, created_at, published_at, source, title, link')
        .gte('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false });

    if (fetchError) {
        console.error('Error fetching news:', fetchError);
        return;
    }

    if (!newsItems) {
        console.log("No news items found in last 24h.");
        return;
    }

    console.log(`Fetched ${newsItems.length} items from last 24h.\n`);

    // Agregation 1: Inserts per hour
    const hourlyCounts: Record<string, number> = {};
    newsItems.forEach(item => {
        const hour = item.created_at.substring(0, 13) + ":00:00"; // YYYY-MM-DDTHH
        hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
    });
    console.table(Object.entries(hourlyCounts).sort().reverse());

    // Agregation 2: Duplicate links
    const linkCounts: Record<string, { count: number, first: string, last: string, title: string }> = {};
    newsItems.forEach(item => {
        if (!item.link) return;
        if (!linkCounts[item.link]) {
            linkCounts[item.link] = { count: 0, first: item.created_at, last: item.created_at, title: item.title };
        }
        const entry = linkCounts[item.link];
        entry.count++;
        if (item.created_at < entry.first) entry.first = item.created_at;
        if (item.created_at > entry.last) entry.last = item.created_at;
    });

    const duplicates = Object.entries(linkCounts)
        .filter(([_, data]) => data.count > 1)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 50);

    console.log('\n2. Duplicate Links (Top 50):');
    if (duplicates.length === 0) {
        console.log("0 duplicates found.");
    } else {
        console.table(duplicates.map(([link, data]) => ({ link, ...data })));
    }

    // Agregation 3: Methodological Duplicates (Title + Source)
    const heuristicCounts: Record<string, { count: number, first: string, last: string }> = {};
    newsItems.forEach(item => {
        if (!item.title || !item.source) return;
        const key = `${item.source}||${item.title}`;
        if (!heuristicCounts[key]) {
            heuristicCounts[key] = { count: 0, first: item.created_at, last: item.created_at };
        }
        const entry = heuristicCounts[key];
        entry.count++;
        if (item.created_at < entry.first) entry.first = item.created_at;
        if (item.created_at > entry.last) entry.last = item.created_at;
    });

    const heuristicDups = Object.entries(heuristicCounts)
        .filter(([_, data]) => data.count > 1)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 50);

    console.log('\n3. Heuristic Duplicates (Source + Title):');
    if (heuristicDups.length === 0) {
        console.log("0 heuristic duplicates found.");
    } else {
        console.table(heuristicDups.map(([key, data]) => ({ key, ...data })));
    }

    // Agregation 4: Old Item Reprocess Signal
    const now = new Date();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const threeSixtyFiveDaysMs = 365 * 24 * 60 * 60 * 1000;

    let olderThan30d = 0;
    let olderThan365d = 0;

    newsItems.forEach(item => {
        if (!item.published_at) return;
        const pubDate = new Date(item.published_at);
        const age = now.getTime() - pubDate.getTime();
        if (age > thirtyDaysMs) olderThan30d++;
        if (age > threeSixtyFiveDaysMs) olderThan365d++;
    });

    console.log('\n4. Old Item Signal:');
    console.log(`Total Inserts (24h): ${newsItems.length}`);
    console.log(`Older than 30d: ${olderThan30d}`);
    console.log(`Older than 365d: ${olderThan365d}`);

    // 5. Newest 50 Rows
    console.log('\n5. Newest 10 Rows Sample:');
    console.table(newsItems.slice(0, 10).map(i => ({
        id: i.id,
        created: i.created_at,
        published: i.published_at,
        source: i.source,
        title: i.title?.substring(0, 30) + '...'
    })));

    console.log('\n--- DB HEALTH CHECK END ---');
}

runHealthCheck().catch(console.error);
