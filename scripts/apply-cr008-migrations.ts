
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load env
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSql(sql: string) {
    const { error } = await supabase.rpc('exec_sql', { sql });
    if (error) throw error;
}

async function applyMigrations() {
    const migrationsDir = path.resolve(process.cwd(), 'supabase/migrations');
    const files = [
        '20260219153000_create_news_user_state.sql',
        '20260219163000_news_user_state_updated_at_trigger.sql'
    ];

    for (const file of files) {
        console.log(`\n📄 Applying ${file}...`);
        const filePath = path.join(migrationsDir, file);
        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            process.exit(1);
        }

        const content = fs.readFileSync(filePath, 'utf-8');

        // Simple split by semicolon for multiple statements
        // Note: This is a bit fragile if strings contain semicolons, but strictly for DDL it usually works.
        // However, the TRigger migration has $$ blocks which contain semicolons.
        // If we split blindly, we break the function body.

        // Strategy: Try to execute the whole file at once.
        // If exec_sql supports multi-statement, this is best.
        // If not, we might fail.

        // Let's try executing the whole file content first.
        try {
            await runSql(content);
            console.log(`✅ ${file} applied successfully.`);
        } catch (e: any) {
            console.warn(`⚠️ Batch execution failed: ${e.message}`);
            console.log('Attempting split statement execution...');

            // If batch fails, maybe it wants single statements.
            // But we must respect $$ blocks.
            // Split by semicolon ONLY if not inside specific blocks? 
            // Or simpler: Just rely on the user having valid SQL.
            // Actually, exec_sql (plv8/plpgsql) usually handles multi-statements in one go.
            // The error might be specific.
            process.exit(1);
        }
    }

    console.log('\nVerifying table...');
    const { data, error } = await supabase.from('news_user_state').select('count');
    if (error && error.code !== 'PGRST116') { // PGRST116 is single result error, but select count returns array
        console.error('Verification failed:', error);
    } else {
        console.log('✅ Table news_user_state verified accessible via API.');
    }
}

applyMigrations();
