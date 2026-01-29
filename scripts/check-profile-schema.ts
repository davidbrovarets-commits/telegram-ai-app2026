
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('🕵️ Checking Profiles Schema...');

    // Try to select 'city' from profiles
    const { data, error } = await supabase
        .from('profiles')
        .select('id, username, city')
        .limit(1);

    if (error) {
        console.error('❌ Error selecting city:', error.message);
        console.error('   This implies the column might be missing.');
    } else {
        console.log('✅ Column exists! Sample data:', data);
    }
}

check();
