
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkImages() {
    console.log('🔍 Checking latest 6 news items for image status...');

    const { data: news, error } = await supabase
        .from('news')
        .select('id, title, image_url, image_status, image_prompt, published_at')
        .order('published_at', { ascending: false })
        .limit(6);

    if (error) {
        console.error('❌ DB Error:', error);
        return;
    }

    if (!news || news.length === 0) {
        console.log('⚠️ No news items found.');
        return;
    }

    // Use simple log instead of table to avoid buffering cutoff
    news.forEach(n => {
        console.log(`ID: ${n.id} | Status: ${n.image_status} | Prompt: ${n.image_prompt ? 'YES' : 'NO'} | URL: ${n.image_url ? 'PRESENT' : 'NULL'}`);
    });

    // logic check
    const generated = news.filter(n => n.image_status === 'generated').length;
    console.log(`\n📊 Stats: ${generated}/${news.length} items have 'image_status' = 'generated'.`);

    if (generated === 0) {
        console.log('⚠️  ROOT CAUSE HINT: Frontend requires status="generated". If stats are 0/6, images are hidden by UI logic.');
    }
}

checkImages();
