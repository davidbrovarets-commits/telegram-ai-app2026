
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTable() {
    console.log('Checking for news_user_state table...');

    // Check via RPC or direct insertion attempt
    const { data, error } = await supabase
        .from('news_user_state')
        .select('count', { count: 'exact', head: true });

    if (error) {
        console.error('Error accessing news_user_state:', error);

        // Check information schema
        /*
        const { data: schemaData, error: schemaError } = await supabase
            .rpc('execute_sql', { sql: "SELECT * FROM information_schema.tables WHERE table_name = 'news_user_state'" });
        */
        // We can't use execute_sql usually without specific setup.
    } else {
        console.log('Success! Table exists. Row count:', data); // data is null for head:true usually, count is in count
    }

    // Check if trigger exists
    // We can't easily check triggers via client without specific permissions or RPC
}

checkTable();
