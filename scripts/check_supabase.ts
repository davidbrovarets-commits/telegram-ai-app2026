
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Checking Supabase Connection...');
console.log('URL:', SUPABASE_URL ? 'DEFINED' : 'MISSING');
console.log('KEY:', SUPABASE_KEY ? 'DEFINED (Length: ' + SUPABASE_KEY.length + ')' : 'MISSING');

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Cannot test connection: Missing credentials.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function test() {
    try {
        const { count, error } = await supabase.from('news').select('*', { count: 'exact', head: true });
        if (error) {
            console.error('Connection Failed:', error.message);
            console.error('Details:', error);
        } else {
            console.log('Connection Successful!');
            console.log('News Count:', count);
        }
    } catch (e: any) {
        console.error('Exception:', e.message);
    }
}

test();
