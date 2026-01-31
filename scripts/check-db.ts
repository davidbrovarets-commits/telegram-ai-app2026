
import { supabase } from './supabaseClient';
import * as dotenv from 'dotenv';
dotenv.config();

async function check() {
    console.log('Checking Supabase DB connection...');
    const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log(`Found ${data?.length} items.`);
        if (data?.length) {
            data.forEach(d => {
                console.log('---');
                console.log('Title:', d.title);
                console.log('UK Summary:', d.uk_summary?.slice(0, 50));
                console.log('Type:', d.type);
                console.log('Published:', d.published_at);
            });
        }
    }
}
check();
