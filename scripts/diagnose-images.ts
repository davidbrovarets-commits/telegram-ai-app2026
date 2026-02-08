
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkImages() {
    const outPath = path.resolve(__dirname, '../diagnose_output.txt');
    console.log(`Writing output to: ${outPath}`);

    let output = '';
    const log = (msg: string) => { console.log(msg); output += msg + '\n'; };

    log('🔍 Checking latest 6 news items for image status...');

    try {
        const { data: news, error } = await supabase
            .from('news')
            .select('id, title, image_url, image_status, image_prompt, published_at')
            .order('published_at', { ascending: false })
            .limit(6);

        if (error) {
            log(`❌ DB Error: ${JSON.stringify(error)}`);
            fs.writeFileSync(outPath, output);
            return;
        }

        if (!news || news.length === 0) {
            log('⚠️ No news items found.');
            fs.writeFileSync(outPath, output);
            return;
        }

        news.forEach(n => {
            log(`ID: ${n.id} | Status: ${n.image_status} | Prompt: ${n.image_prompt ? 'YES' : 'NO'} | URL: ${n.image_url ? 'PRESENT' : 'NULL'}`);
        });

        const generated = news.filter(n => n.image_status === 'generated').length;
        log(`\n📊 Stats: ${generated}/${news.length} items have 'image_status' = 'generated'.`);

        if (generated === 0) {
            log('⚠️  ROOT CAUSE HINT: Frontend requires status="generated". If stats are 0/6, images are hidden by UI logic.');
        }

    } catch (err: any) {
        log(`❌ Unexpected Error: ${err.message}`);
    }

    fs.writeFileSync(outPath, output);
}

checkImages();
