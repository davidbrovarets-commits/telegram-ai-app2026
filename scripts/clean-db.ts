
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ACCESS_TOKEN!; // usage of service role or access token if available, usually we use VITE keys for client but for admin script we might need more permissions.
// actually scripts mostly use service role if available or just anon if RLS allows.
// Let's use the keys from .env if they exist.

const supabase = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY!);

async function clean() {
    console.log('Cleaning [UA Fail] items...');

    // 1. Delete items with [UA Fail] in summary
    const { data: failSummary, error: err1 } = await supabase
        .from('news')
        .delete()
        .ilike('uk_summary', '%[UA Fail]%')
        .select();

    if (err1) console.error('Error deleting summary fails:', err1);
    else console.log(`Deleted ${failSummary?.length || 0} items with [UA Fail] summary.`);

    // 2. Delete items with [UA Fail] in title
    const { data: failTitle, error: err2 } = await supabase
        .from('news')
        .delete()
        .ilike('title', '%[UA Fail]%')
        .select();

    if (err2) console.error('Error deleting title fails:', err2);
    else console.log(`Deleted ${failTitle?.length || 0} items with [UA Fail] title.`);

    console.log('Done.');
}

clean();
