
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('------------------------------------------------');
    console.log('🕵️ Checking DB Content');

    // Check distinct sources
    const { data: sources, error: sourceError } = await supabase
        .from('news')
        .select('source, region')
        .order('source');

    if (sourceError) {
        console.error('Error fetching sources:', sourceError.message);
    } else {
        // Group by source (client side since distinct unavailable easily in simple client)
        const counts = {};
        sources.forEach(s => {
            const key = `${s.source} (${s.region})`;
            counts[key] = (counts[key] || 0) + 1;
        });
        console.log('Sources in DB:', counts);
    }
    console.log('------------------------------------------------');
}

check();
