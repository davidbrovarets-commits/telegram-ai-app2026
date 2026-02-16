
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkDuplicates() {
    console.log('Fetching news titles...');
    const { data: news, error } = await supabase
        .from('news')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })
        .limit(500);

    if (error) {
        console.error(error);
        return;
    }

    const titleMap = new Map<string, number[]>();
    news.forEach(n => {
        const t = n.title?.trim();
        if (!t) return;
        if (!titleMap.has(t)) titleMap.set(t, []);
        titleMap.get(t)?.push(n.id);
    });

    let dupesFound = 0;
    titleMap.forEach((ids, title) => {
        if (ids.length > 1) {
            console.log(`Duplicate Title: "${title.substring(0, 50)}..." -> IDs: ${ids.join(', ')}`);
            dupesFound++;
        }
    });

    if (dupesFound === 0) {
        console.log('No duplicates found in last 500 items.');
    } else {
        console.log(`Found ${dupesFound} duplicate sets.`);
    }
}

checkDuplicates();
