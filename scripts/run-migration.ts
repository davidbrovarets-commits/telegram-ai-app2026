/**
 * Database Migration Runner
 * Executes the rate_limits table creation in Supabase
 */

import { supabase } from '../src/supabaseClient';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
    console.log('\n🗄️  Running rate_limits table migration...\n');

    try {
        // Read SQL migration file
        const migrationPath = path.join(__dirname, '../supabase/migrations/create_rate_limits.sql');
        const sql = fs.readFileSync(migrationPath, 'utf-8');

        // Split into individual statements (basic splitter)
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'));

        console.log(`Found ${statements.length} SQL statements to execute\n`);

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i];
            console.log(`[${i + 1}/${statements.length}] Executing statement...`);

            const { error } = await supabase.rpc('exec_sql', { sql: stmt });

            if (error) {
                // Try direct query if RPC fails
                const { error: directError } = await supabase.from('_').select('*').limit(0);
                console.log(`⚠️  Note: Using Supabase Dashboard for complex migrations\n`);
                console.log(`Please run the SQL manually in Supabase Dashboard > SQL Editor:\n`);
                console.log('─'.repeat(50));
                console.log(sql);
                console.log('─'.repeat(50));
                return;
            }

            console.log(`✅ Done\n`);
        }

        console.log('✅ Migration completed successfully!\n');

        // Verify table exists
        const { data, error } = await supabase
            .from('rate_limits')
            .select('*')
            .limit(0);

        if (error) {
            console.log(`❌ Table verification failed: ${error.message}\n`);
            console.log('Please run SQL manually in Supabase Dashboard > SQL Editor\n');
        } else {
            console.log('✅ Table verified: rate_limits exists and is accessible\n');
        }

    } catch (err) {
        console.error('❌ Migration error:', err);
        console.log('\n📋 Manual Migration Instructions:\n');
        console.log('1. Go to Supabase Dashboard > SQL Editor');
        console.log('2. Run the SQL from: supabase/migrations/create_rate_limits.sql');
        console.log('3. Verify table was created\n');
    }
}

// Run migration
runMigration().catch(console.error);
