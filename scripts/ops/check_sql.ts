import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL!;
const projectRef = url.replace('https://', '').split('.')[0];
const token = process.env.SUPABASE_ACCESS_TOKEN!;

console.log('Project ref:', projectRef);

const sql = `
SELECT 'news' AS tabel, count(*) AS rows FROM news
UNION ALL
SELECT 'news_user_state', count(*) FROM news_user_state;
`;

const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
});

console.log('HTTP Status:', res.status);
const data = await res.json();
console.log('Result:', JSON.stringify(data, null, 2));

process.exit(0);
