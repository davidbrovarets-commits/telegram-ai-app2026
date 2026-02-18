/**
 * ═══════════════════════════════════════════════════════════════
 * ADMIN: Verify ZERO News State (DB + Storage)
 *
 * Safety-gated: EXPECT_ZERO_NEWS must equal "YES"
 * Exit 0 = verified zero news everywhere
 * Exit 2 = leftovers found (when FAIL_ON_LEFTOVERS=true)
 * ═══════════════════════════════════════════════════════════════
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════

const EXPECT_ZERO = process.env.EXPECT_ZERO_NEWS || '';
const FAIL_ON_LEFTOVERS = (process.env.FAIL_ON_LEFTOVERS || 'true').toLowerCase() !== 'false';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const NEWS_BUCKET = process.env.SUPABASE_NEWS_BUCKET || 'images';

// Patterns that identify news-related tables
const NEWS_TABLE_PATTERNS = [
    'news', 'article', 'feed', 'source', 'queue',
    'banner', 'prompt', 'image', 'archive', 'inspector',
    'dedup', 'pipeline',
];

// Known candidate tables (fallback if pg_tables query fails)
const CANDIDATE_TABLES = [
    'news', 'news_items', 'news_articles', 'processing_queue',
    'news_processing_queue', 'feed_items', 'sources', 'news_sources',
    'news_archive', 'news_prompts', 'news_images', 'banner_jobs',
    'weekly_banners', 'ai_inspector_results', 'pipeline_runs', 'pipeline_state',
];

// Storage search config
const CANDIDATE_BUCKETS = [NEWS_BUCKET, 'news', 'public', 'assets'];
const STORAGE_PREFIXES = [
    'news/', 'assets/news/', 'public/assets/news/',
    'public/assets/news/hero/', 'banners/', 'hero/',
    'thumbs/', 'generated/', 'archive/',
];

const SUSPICIOUS_PATTERNS = ['/news/', 'news-', 'banner', 'hero', 'archive'];

// ═══════════════════════════════════════════════════════════════
// SAFETY GATE
// ═══════════════════════════════════════════════════════════════

function enforceGate(): void {
    if (EXPECT_ZERO !== 'YES') {
        console.error('╔══════════════════════════════════════════════════════════════╗');
        console.error('║  ❌ EXPECT_ZERO_NEWS must equal "YES"                       ║');
        console.error(`║  Got: "${EXPECT_ZERO || '(empty)'}"${' '.repeat(Math.max(0, 45 - (EXPECT_ZERO || '(empty)').length))}║`);
        console.error('╚══════════════════════════════════════════════════════════════╝');
        process.exit(1);
    }
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Aborting.');
        process.exit(1);
    }
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║  🔍 ZERO NEWS STATE VERIFICATION                           ║');
    console.log(`║  Target: ${SUPABASE_URL.substring(0, 48)}...  ║`);
    console.log(`║  Fail on leftovers: ${FAIL_ON_LEFTOVERS ? 'YES' : 'NO'}                                 ║`);
    console.log('╚══════════════════════════════════════════════════════════════╝');
}

// ═══════════════════════════════════════════════════════════════
// DB VERIFICATION
// ═══════════════════════════════════════════════════════════════

interface TableResult {
    table: string;
    rowCount: number;
    status: 'zero' | 'leftover' | 'error' | 'not_found';
    error?: string;
}

function isNewsRelated(tableName: string): boolean {
    const lower = tableName.toLowerCase();
    return NEWS_TABLE_PATTERNS.some(p => lower.includes(p));
}

async function probeAndCount(sb: SupabaseClient, table: string): Promise<TableResult> {
    try {
        const { count, error } = await sb.from(table).select('*', { count: 'exact', head: true });
        if (error) {
            if (error.message?.includes('does not exist') || error.code === '42P01') {
                return { table, rowCount: 0, status: 'not_found' };
            }
            return { table, rowCount: -1, status: 'error', error: error.message };
        }
        const c = count ?? 0;
        return { table, rowCount: c, status: c === 0 ? 'zero' : 'leftover' };
    } catch (e) {
        return { table, rowCount: -1, status: 'error', error: String(e) };
    }
}

async function verifyDB(sb: SupabaseClient): Promise<TableResult[]> {
    console.log('\n═══ DB VERIFICATION ═══');
    const results: TableResult[] = [];

    // Try discovering tables via RPC first
    let discoveredTables: string[] = [];
    try {
        const { data, error } = await sb.rpc('exec_sql', {
            query: "SELECT tablename FROM pg_tables WHERE schemaname='public'"
        });
        if (!error && Array.isArray(data)) {
            discoveredTables = data.map((r: any) => r.tablename || r.result || '').filter(Boolean);
            console.log(`  [discovery] Found ${discoveredTables.length} public tables via RPC`);
        }
    } catch {
        // RPC not available, fall through
    }

    // Build final table list: discovered (filtered) + candidates
    const tablesToCheck = new Set<string>();
    for (const t of discoveredTables) {
        if (isNewsRelated(t)) tablesToCheck.add(t);
    }
    for (const t of CANDIDATE_TABLES) {
        tablesToCheck.add(t);
    }

    for (const table of tablesToCheck) {
        const result = await probeAndCount(sb, table);
        if (result.status === 'not_found') continue; // Silently skip non-existent
        const icon = result.status === 'zero' ? '✅' : result.status === 'leftover' ? '❌' : '⚠️';
        console.log(`  ${icon} ${table}: ${result.rowCount} rows`);
        results.push(result);
    }

    return results;
}

// ═══════════════════════════════════════════════════════════════
// STORAGE VERIFICATION
// ═══════════════════════════════════════════════════════════════

interface StorageResult {
    bucket: string;
    prefix: string;
    objectCount: number;
    suspicious: string[];
}

async function countObjects(sb: SupabaseClient, bucket: string, prefix: string): Promise<{ count: number; paths: string[] }> {
    const allPaths: string[] = [];
    const PAGE_SIZE = 500;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await sb.storage.from(bucket).list(prefix, { limit: PAGE_SIZE, offset });
        if (error || !data || data.length === 0) {
            hasMore = false;
            break;
        }
        for (const obj of data) {
            // Skip folder markers (virtual directories have id=null in Supabase Storage)
            if (obj.name && (obj as any).id !== null) allPaths.push(`${prefix}${obj.name}`);
        }
        if (data.length < PAGE_SIZE) hasMore = false;
        else offset += PAGE_SIZE;
    }

    return { count: allPaths.length, paths: allPaths };
}

async function verifyStorage(sb: SupabaseClient): Promise<StorageResult[]> {
    console.log('\n═══ STORAGE VERIFICATION ═══');
    const results: StorageResult[] = [];
    const triedBuckets = new Set<string>();

    for (const bucket of CANDIDATE_BUCKETS) {
        if (triedBuckets.has(bucket)) continue;
        triedBuckets.add(bucket);

        // Check each prefix
        for (const prefix of STORAGE_PREFIXES) {
            const { count, paths } = await countObjects(sb, bucket, prefix);
            if (count === 0) continue;

            const icon = count === 0 ? '✅' : '❌';
            console.log(`  ${icon} ${bucket}/${prefix}: ${count} objects`);
            if (count > 0 && count <= 10) {
                for (const p of paths) console.log(`      ↳ ${p}`);
            }
            results.push({ bucket, prefix, objectCount: count, suspicious: paths.slice(0, 50) });
        }

        // Broad root scan for suspicious objects
        const { count: rootCount, paths: rootPaths } = await countObjects(sb, bucket, '');
        const suspiciousRoot = rootPaths.filter(p => {
            const lower = p.toLowerCase();
            return SUSPICIOUS_PATTERNS.some(pat => lower.includes(pat));
        });

        if (suspiciousRoot.length > 0) {
            console.log(`  ⚠️  ${bucket}/ (root scan): ${suspiciousRoot.length} suspicious objects out of ${rootCount}`);
            for (const p of suspiciousRoot.slice(0, 20)) console.log(`      ↳ ${p}`);
            results.push({ bucket, prefix: '(root-suspicious)', objectCount: suspiciousRoot.length, suspicious: suspiciousRoot.slice(0, 50) });
        }
    }

    if (results.length === 0) {
        console.log('  ✅ No news-related storage objects found');
    }

    return results;
}

// ═══════════════════════════════════════════════════════════════
// REPORT & EXIT
// ═══════════════════════════════════════════════════════════════

function printReport(dbResults: TableResult[], storageResults: StorageResult[]): boolean {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║              ZERO NEWS STATE REPORT                        ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');

    let hasLeftovers = false;

    console.log('║  DB Tables:');
    const withData = dbResults.filter(r => r.status !== 'not_found');
    if (withData.length === 0) {
        console.log('║    (no news-related tables found)');
    }
    for (const r of withData) {
        const icon = r.rowCount === 0 ? '✅' : '❌';
        console.log(`║    ${icon} ${r.table}: ${r.rowCount} rows`);
        if (r.rowCount > 0) hasLeftovers = true;
    }

    console.log('║  Storage:');
    if (storageResults.length === 0) {
        console.log('║    ✅ No news-related objects found');
    }
    for (const r of storageResults) {
        const icon = r.objectCount === 0 ? '✅' : '❌';
        console.log(`║    ${icon} ${r.bucket}/${r.prefix}: ${r.objectCount} objects`);
        if (r.objectCount > 0) hasLeftovers = true;
    }

    console.log('╚══════════════════════════════════════════════════════════════╝');

    return hasLeftovers;
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main(): Promise<void> {
    enforceGate();

    const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
    });

    const dbResults = await verifyDB(sb);
    const storageResults = await verifyStorage(sb);
    const hasLeftovers = printReport(dbResults, storageResults);

    if (hasLeftovers) {
        console.error('\n❌ LEFTOVERS DETECTED — system is NOT in zero-news state.');
        if (FAIL_ON_LEFTOVERS) process.exit(2);
    } else {
        console.log('\n✅ VERIFIED: ZERO NEWS EVERYWHERE');
    }
}

main().catch((err) => {
    console.error('❌ Fatal error during verification:', err);
    process.exit(1);
});
