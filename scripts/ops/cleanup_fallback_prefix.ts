import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL!;
const projectRef = url.replace('https://', '').split('.')[0];
const token = process.env.SUPABASE_ACCESS_TOKEN!;

async function runSQL(label: string, sql: string) {
    const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: sql })
    });
    const data = await res.json();
    console.log(`\n=== ${label} (HTTP ${res.status}) ===`);
    console.log(JSON.stringify(data, null, 2));
    return data;
}

async function main() {
    // STEP 1: PREVIEW
    await runSQL('PREVIEW — Rows with [UA Fallback] prefix', `
        SELECT id, created_at,
            LEFT(title, 80) as title_preview,
            LEFT(uk_summary, 80) as summary_preview,
            LEFT(content, 80) as content_preview,
            reason_tag
        FROM public.news
        WHERE title ILIKE '[UA Fallback] %'
           OR uk_summary ILIKE '[UA Fallback] %'
           OR content ILIKE '[UA Fallback Content] %'
           OR content ILIKE '[UA Fallback] %'
        ORDER BY created_at DESC
        LIMIT 50;
    `);

    // STEP 2: UPDATE title + uk_summary
    await runSQL('UPDATE 1 — Strip [UA Fallback] from title + uk_summary', `
        UPDATE public.news
        SET
            title = regexp_replace(title, '^\\[UA Fallback\\]\\s*', '', 'i'),
            uk_summary = regexp_replace(uk_summary, '^\\[UA Fallback\\]\\s*', '', 'i')
        WHERE title ILIKE '[UA Fallback] %'
           OR uk_summary ILIKE '[UA Fallback] %';
    `);

    // STEP 3: Strip [UA Fallback Content] from content
    await runSQL('UPDATE 2 — Strip [UA Fallback Content] from content', `
        UPDATE public.news
        SET content = regexp_replace(content, '^\\[UA Fallback Content\\]\\s*', '', 'i')
        WHERE content ILIKE '[UA Fallback Content] %';
    `);

    // STEP 4: Strip [UA Fallback] from content
    await runSQL('UPDATE 3 — Strip [UA Fallback] from content', `
        UPDATE public.news
        SET content = regexp_replace(content, '^\\[UA Fallback\\]\\s*', '', 'i')
        WHERE content ILIKE '[UA Fallback] %';
    `);

    // STEP 5: VERIFY — must return 0
    await runSQL('VERIFY — Remaining (must be 0)', `
        SELECT count(*) AS remaining
        FROM public.news
        WHERE title ILIKE '[UA Fallback] %'
           OR uk_summary ILIKE '[UA Fallback] %'
           OR content ILIKE '[UA Fallback Content] %'
           OR content ILIKE '[UA Fallback] %';
    `);

    process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
