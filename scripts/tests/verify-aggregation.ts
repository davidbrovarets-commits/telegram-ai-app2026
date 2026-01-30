
import { runDailyAggregation } from '../analytics/push-aggregation';
import { logDelivered, logOpened, clearEvents, PushContext } from '../analytics/push-event-logger';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_SOURCE_ID = 'city_leipzig_aggregation_TEST';

const testContext: PushContext = {
    telegramUserId: 'test_user_agg',
    country: 'DE',
    land: 'Sachsen',
    city: 'Leipzig',
    scope: 'CITY',
    priority: 'MEDIUM',
    source_id: TEST_SOURCE_ID,
    dedupe_group: 'agg_test',
    template_id: 'CITY_GENERAL'
};

async function runTest() {
    console.log('=== STARTING AGGREGATION PERSISTENCE TEST ===');

    // 1. Clean up old test data
    console.log('Cleaning up old test data...');
    await supabase.from('push_metrics_daily').delete().eq('source_id', TEST_SOURCE_ID);
    clearEvents();

    // 2. Generate raw events (in memory logger)
    console.log('Generating raw events...');
    // Day 1: 10 delivered, 5 opened
    const today = new Date();

    for (let i = 0; i < 10; i++) {
        const { push_id } = logDelivered({ ...testContext, telegramUserId: `user_${i}` });
        if (i < 5) logOpened({ ...testContext, telegramUserId: `user_${i}` }, push_id);
    }

    // 3. Run Aggregation
    console.log('Running daily aggregation...');
    const metrics = await runDailyAggregation(today);
    console.log(`Aggregation returned ${metrics.length} groups.`);

    if (metrics.length === 0) throw new Error('No metrics returned from function');

    // 4. Verify DB
    console.log('Verifying DB persistence...');
    const { data, error } = await supabase
        .from('push_metrics_daily')
        .select('*')
        .eq('source_id', TEST_SOURCE_ID)
        .eq('date', today.toISOString().split('T')[0]);

    if (error) {
        throw new Error(`DB Query Error: ${error.message}`);
    }

    if (!data || data.length === 0) {
        throw new Error('No metrics found in DB for test source');
    }

    const row = data[0];
    console.log('DB Row:', row);

    if (row.delivered_count !== 10) throw new Error(`Expected 10 delivered, got ${row.delivered_count}`);
    if (row.opened_count !== 5) throw new Error(`Expected 5 opened, got ${row.opened_count}`);

    // Clean up
    await supabase.from('push_metrics_daily').delete().eq('source_id', TEST_SOURCE_ID);

    console.log('✅ Aggregation Persistence Verified!');
}

runTest().catch(e => {
    console.error('TEST FAILED:', e);
    process.exit(1);
});
