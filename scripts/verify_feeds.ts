
import Parser from 'rss-parser';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { SOURCE_REGISTRY } from './registries/source-registry';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkFeeds() {
    console.log('--- CHECKING RSS FEEDS ---');
    const parser = new Parser();
    const sourcesToCheck = [
        'sn_lvz', // Leipzig specific
        'sn_mdr', // Sachsen
        'breg_bundesregierung_news' // Control (should work)
    ];

    for (const id of sourcesToCheck) {
        const src = SOURCE_REGISTRY.find(s => s.source_id === id);
        if (!src) continue;

        console.log(`\nTesting ${src.name} (${src.base_url})...`);
        try {
            const feed = await parser.parseURL(src.base_url);
            console.log(`✅ Success! Found ${feed.items.length} items.`);
            console.log(`   Sample: ${feed.items[0]?.title}`);
        } catch (e) {
            console.error(`❌ FAILED: ${e.message}`);
        }
    }
}

async function checkDb() {
    console.log('\n--- CHECKING DB COUNTS ---');
    // Check specific sources
    const sourcesOfInterest = ['L6_sn_lvz', 'L6_sn_mdr', 'L6_breg_bundesregierung_news'];

    for (const s of sourcesOfInterest) {
        const { count, error } = await supabase
            .from('news')
            .select('*', { count: 'exact', head: true })
            .eq('source', s);

        if (error) console.error(`DB Error for ${s}:`, error.message);
        else console.log(`DB Count for ${s}: ${count}`);
    }

    // Check Leipzig City items
    const { count: cityCount } = await supabase
        .from('news')
        .select('*', { count: 'exact', head: true })
        .eq('city', 'Leipzig');
    console.log(`\nDB Count for city='Leipzig': ${cityCount}`);
}

async function main() {
    await checkFeeds();
    await checkDb();
}

main();
