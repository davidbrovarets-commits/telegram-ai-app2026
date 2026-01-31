
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log('--- DIAGNOSING NEWS FEED ---');

    // 1. Check Total Count
    const { count, error: countError } = await supabase.from('news').select('*', { count: 'exact', head: true });
    if (countError) {
        console.error('Error fetching count:', countError);
        return;
    }
    console.log(`Total News Items: ${count}`);

    if (count === 0) {
        console.warn('⚠️ DATABASE IS EMPTY! Scraper might have failed.');
        return;
    }

    // 2. Check Status Distribution
    const { data: statusData } = await supabase
        .from('news')
        .select('status, type');

    const statusCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};

    statusData?.forEach((n: any) => {
        statusCounts[n.status] = (statusCounts[n.status] || 0) + 1;
        typeCounts[n.type] = (typeCounts[n.type] || 0) + 1;
    });

    console.log('\nStatus Distribution:', statusCounts);
    console.log('Type Distribution:', typeCounts);

    // 3. Check POOL candidates for L6 Slots
    console.log('\nChecking POOL candidates for slots:');
    const SLOTS = ['IMPORTANT', 'FUN', 'IMPORTANT', 'INFO', 'FUN', 'INFO'];

    const { data: poolItems } = await supabase
        .from('news')
        .select('*')
        .in('status', ['POOL', 'ACTIVE'])
        .order('priority', { ascending: false }) // Legacy priority check
        .limit(50);

    if (!poolItems || poolItems.length === 0) {
        console.warn('⚠️ No items in POOL or ACTIVE status!');
    } else {
        console.log(`Found ${poolItems.length} candidates.`);
        SLOTS.forEach((slot, idx) => {
            const match = poolItems.find((n: any) => n.type === slot);
            console.log(`Slot #${idx + 1} [${slot}]: ${match ? '✅ Found ID ' + match.id : '❌ MISSING'}`);
        });
    }

}

diagnose();
