
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
    console.log('--- CHECKING EXISTING SOURCES IN DB ---');

    // Get all distinct sources
    // PostgREST doesn't support distinct on select easily without rpc, so we fetch source column and aggregate in JS (inefficient but fine for 236 rows)
    const { data, error } = await supabase
        .from('news')
        .select('source, source_id, city, land');

    if (error) {
        console.error('DB Error:', error.message);
        return;
    }

    const sourceCounts = {};
    const cityCounts = {};

    data.forEach(row => {
        // Source
        const s = row.source || 'unspecified';
        sourceCounts[s] = (sourceCounts[s] || 0) + 1;

        // City
        if (row.city) {
            cityCounts[row.city] = (cityCounts[row.city] || 0) + 1;
        }
    });

    console.log('\nSOURCES WITH DATA:');
    console.table(sourceCounts);

    console.log('\nCITIES WITH DATA:');
    console.table(cityCounts);

    console.log('\nTOTAL ROWS:', data.length);
}

main();
