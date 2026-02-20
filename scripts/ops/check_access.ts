import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const admin = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
    console.log('=== SUPABASE FULL ACCESS VERIFICATION ===\n');

    // 1. READ — news table
    const { data: newsRow, error: e1 } = await admin.from('news').select('id, title').limit(1).single();
    console.log('[1] READ news:', e1 ? '❌ ' + e1.message : `✅ (id=${newsRow.id})`);
    if (e1) { process.exit(1); }

    // 2. READ — auth.users (via service role)
    const { data: users, error: e2 } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
    const userId = users?.users?.[0]?.id;
    console.log('[2] READ auth.users:', e2 ? '❌ ' + e2.message : `✅ (user_id=${userId?.substring(0, 8)}...)`);
    if (!userId) { console.log('No users found, cannot test write.'); process.exit(1); }

    // 3. WRITE — upsert into news_user_state with REAL IDs
    const testNewsId = newsRow.id;
    const { error: e3 } = await admin.from('news_user_state').upsert(
        { user_id: userId, news_id: testNewsId, status: 'ARCHIVED' },
        { onConflict: 'user_id,news_id' }
    );
    console.log('[3] WRITE news_user_state (upsert):', e3 ? '❌ ' + e3.message : '✅');

    // 4. DELETE — cleanup test row
    const { error: e4 } = await admin.from('news_user_state').delete().match({ user_id: userId, news_id: testNewsId });
    console.log('[4] DELETE news_user_state (cleanup):', e4 ? '❌ ' + e4.message : '✅');

    // 5. STORAGE — list buckets + list files in first bucket
    const { data: buckets, error: e5 } = await admin.storage.listBuckets();
    console.log('[5] STORAGE list buckets:', e5 ? '❌ ' + e5.message : `✅ (${buckets?.map(b => b.name).join(', ')})`);

    if (buckets && buckets.length > 0) {
        const { data: files, error: e5b } = await admin.storage.from(buckets[0].name).list('', { limit: 3 });
        console.log(`[5b] STORAGE list files (${buckets[0].name}):`, e5b ? '❌ ' + e5b.message : `✅ (${files?.length} items)`);
    }

    // 6. RPC — test raw SQL via service role
    const { data: rpcData, error: e6 } = await admin.rpc('execute_sql', { sql: "SELECT count(*) as cnt FROM news" });
    console.log('[6] RPC execute_sql:', e6 ? '⚠️ ' + e6.message + ' (RPC may not exist)' : `✅ (count=${JSON.stringify(rpcData)})`);

    // 7. EDGE FUNCTIONS — invoke check
    const { error: e7 } = await admin.functions.invoke('serve-feed', { body: { limit: 1 } });
    console.log('[7] EDGE FUNCTION (serve-feed):', e7 ? '❌ ' + e7.message : '✅');

    // SUMMARY
    const checks = [e1, e2, e3, e4, e5, e7];
    const passed = checks.filter(e => !e).length;
    console.log(`\n=== RESULT: ${passed}/${checks.length} CORE CHECKS PASSED ===`);
    if (passed === checks.length) {
        console.log('🟢 SUPABASE ACCESS: 100% — FULL ADMIN (read + write + storage + auth + edge functions)');
    }

    process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
