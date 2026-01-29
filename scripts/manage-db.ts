
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const token = process.env.SUPABASE_ACCESS_TOKEN;
// Extract project ref from SUPABASE_URL (e.g., https://wbajyysqvkkdqsugupyj.supabase.co -> wbajyysqvkkdqsugupyj)
const projectRef = process.env.VITE_SUPABASE_URL?.match(/https:\/\/([^.]+)\./)?.[1];

console.log('--- DB MANAGER DIAGNOSTICS ---');
console.log(`Token Present: ${!!token}`);
console.log(`Project Ref: ${projectRef}`);
console.log(`URL: https://api.supabase.com/v1/projects/${projectRef}/query`);
console.log('------------------------------');

if (!token || !projectRef) {
    console.error('Missing SUPABASE_ACCESS_TOKEN or VITE_SUPABASE_URL invalid');
    process.exit(1);
}

async function runQuery(sql: string) {
    console.log(`🔌 Executing SQL: ${sql}`);
    const url = `https://api.supabase.com/v1/projects/${projectRef}/query`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ query: sql })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`❌ API Error ${response.status}:`);
            console.error(errText);
            throw new Error(`API Error ${response.status}: ${errText}`);
        }

        const result = await response.json();
        console.log('✅ Success:', JSON.stringify(result, null, 2));
        return result;

    } catch (error) {
        console.error('❌ Network/Script Error:', error);
        process.exit(1);
    }
}

const sqlArg = process.argv[2];
if (sqlArg) {
    runQuery(sqlArg);
} else {
    console.log('Usage: tsx scripts/manage-db.ts "SQL_QUERY"');
}
