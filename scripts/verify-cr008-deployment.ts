
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Fix ESM __dirname
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verify() {
    console.log('Verifying via REST API select...');
    // Use Service Key to bypass RLS, though RLS should allow read if policies set correctly.
    // count=exact, head=true does a HEAD request or simple select count.

    const { count, error, status, statusText } = await supabase
        .from('news_user_state')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('Verification Failed:', error);
        console.error('Status:', status, statusText);
    } else {
        console.log('✅ Table news_user_state exists!');
        console.log('Row count:', count);
        console.log('Status:', status);

        // Also verify Enum if possible? 
        // We can try to insert a dummy row and delete it? No, side effects.
        // We can assumes checks passed if table select works.
    }
}

verify();
