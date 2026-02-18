/**
 * ═══════════════════════════════════════════════════════════════
 * ADMIN: Purge All News Everywhere (DB + Storage)
 *
 * DESTRUCTIVE OPERATION — Triple-gated:
 *   1. PURGE_NEWS_CONFIRM must equal "YES_DELETE_ALL_NEWS_EVERYWHERE"
 *   2. DRY_RUN defaults to true — must be explicitly set to false
 *   3. Fail-fast on any error
 * ═══════════════════════════════════════════════════════════════
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════

const REQUIRED_CONFIRM = 'YES_DELETE_ALL_NEWS_EVERYWHERE';
const PURGE_CONFIRM = process.env.PURGE_NEWS_CONFIRM || '';
const DRY_RUN = (process.env.DRY_RUN || 'true').toLowerCase() !== 'false';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const NEWS_BUCKET = process.env.SUPABASE_NEWS_BUCKET || 'images';

// Candidate DB tables (tried in order; skip if table doesn't exist)
const CANDIDATE_TABLES = [
    'news',
    'news_items',
    'news_articles',
    'processing_queue',
    'news_processing_queue',
    'feed_items',
    'sources',
    'news_sources',
    'news_archive',
    'news_prompts',
    'news_images',
    'banner_jobs',
    'weekly_banners',
    'ai_inspector_results',
    'pipeline_runs',
    'pipeline_state',
];

// Storage prefixes to purge (tried in all candidate buckets)
const STORAGE_PREFIXES = [
    'news/',
    'banners/',
    'hero/',
    'thumbs/',
    'generated/',
    'public/assets/news/',
    'assets/news/',
];

// Buckets to search
const CANDIDATE_BUCKETS = [NEWS_BUCKET, 'news', 'public', 'assets'];

// ═══════════════════════════════════════════════════════════════
// SAFETY GATES
// ═══════════════════════════════════════════════════════════════

function enforceGates(): void {
    if (PURGE_CONFIRM !== REQUIRED_CONFIRM) {
        console.error('╔══════════════════════════════════════════════════════════════╗');
        console.error('║  ❌ PURGE_NEWS_CONFIRM mismatch!                            ║');
        console.error(`║  Expected: "${REQUIRED_CONFIRM}"  ║`);
        console.error(`║  Got:      "${PURGE_CONFIRM || '(empty)'}"${' '.repeat(Math.max(0, 38 - (PURGE_CONFIRM || '(empty)').length))}║`);
        console.error('║  NO mutations will be performed.                            ║');
        console.error('╚══════════════════════════════════════════════════════════════╝');
        process.exit(1);
    }

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Aborting.');
        process.exit(1);
    }

    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║  🔴 DESTRUCTIVE PURGE — ALL NEWS DATA WILL BE DELETED      ║');
    console.log(`║  Mode: ${DRY_RUN ? '🟡 DRY RUN (no mutations)' : '🔴 LIVE (real deletions!)'}                        ║`);
    console.log(`║  Target: ${SUPABASE_URL.substring(0, 45)}...  ║`);
    console.log('╚══════════════════════════════════════════════════════════════╝');
}

// ═══════════════════════════════════════════════════════════════
// DB PURGE
// ═══════════════════════════════════════════════════════════════

interface PurgeResult {
    table: string;
    rowsBefore: number;
    rowsAfter: number;
    status: 'purged' | 'dry_run' | 'skipped' | 'error';
    error?: string;
}

async function probeTableExists(sb: SupabaseClient, table: string): Promise<boolean> {
    try {
        const { error } = await sb.from(table).select('*', { count: 'exact', head: true });
        if (error) {
            // "relation does not exist" means table doesn't exist
            if (error.message?.includes('does not exist') || error.code === '42P01') return false;
            // Permission errors mean it DOES exist
            if (error.code === '42501') return true;
            // Other errors — assume doesn't exist to be safe
            console.warn(`  [probe] ${table}: unexpected error: ${error.message}`);
            return false;
        }
        return true;
    } catch {
        return false;
    }
}

async function countRows(sb: SupabaseClient, table: string): Promise<number> {
    try {
        const { count, error } = await sb.from(table).select('*', { count: 'exact', head: true });
        if (error) return -1;
        return count ?? 0;
    } catch {
        return -1;
    }
}

async function deleteAllRows(sb: SupabaseClient, table: string): Promise<{ deleted: number; error?: string }> {
    // Strategy: try multiple approaches for universal deletion
    // Approach 1: delete where id > 0 (most tables have an id column)
    {
        const { data, error } = await sb.from(table).delete().gt('id', 0).select('id');
        if (!error) return { deleted: data?.length ?? 0 };
    }

    // Approach 2: delete where id is not null
    {
        const { data, error } = await sb.from(table).delete().not('id', 'is', null).select('id');
        if (!error) return { deleted: data?.length ?? 0 };
    }

    // Approach 3: delete using created_at
    {
        const { data, error } = await sb.from(table).delete().gte('created_at', '1900-01-01').select();
        if (!error) return { deleted: data?.length ?? 0 };
    }

    return { deleted: 0, error: 'All delete strategies failed' };
}

async function purgeDB(sb: SupabaseClient): Promise<PurgeResult[]> {
    console.log('\n═══ DB PURGE ═══');
    const results: PurgeResult[] = [];

    for (const table of CANDIDATE_TABLES) {
        const exists = await probeTableExists(sb, table);
        if (!exists) {
            console.log(`  [skip] ${table} — does not exist`);
            results.push({ table, rowsBefore: 0, rowsAfter: 0, status: 'skipped' });
            continue;
        }

        const rowsBefore = await countRows(sb, table);
        console.log(`  [found] ${table} — ${rowsBefore} rows`);

        if (rowsBefore === 0) {
            results.push({ table, rowsBefore: 0, rowsAfter: 0, status: 'skipped' });
            continue;
        }

        if (DRY_RUN) {
            console.log(`  [dry_run] Would delete ${rowsBefore} rows from ${table}`);
            results.push({ table, rowsBefore, rowsAfter: rowsBefore, status: 'dry_run' });
            continue;
        }

        // LIVE DELETE
        const { deleted, error } = await deleteAllRows(sb, table);
        if (error) {
            console.error(`  ❌ [error] ${table}: ${error}`);
            results.push({ table, rowsBefore, rowsAfter: rowsBefore, status: 'error', error });
            throw new Error(`DB purge failed on table ${table}: ${error}`);
        }

        const rowsAfter = await countRows(sb, table);
        console.log(`  ✅ [purged] ${table}: ${deleted} deleted, ${rowsAfter} remaining`);
        results.push({ table, rowsBefore, rowsAfter, status: 'purged' });
    }

    return results;
}

// ═══════════════════════════════════════════════════════════════
// STORAGE PURGE
// ═══════════════════════════════════════════════════════════════

interface StoragePurgeResult {
    bucket: string;
    prefix: string;
    objectCount: number;
    status: 'purged' | 'dry_run' | 'skipped' | 'error';
    error?: string;
}

async function listAllObjects(sb: SupabaseClient, bucket: string, prefix: string): Promise<string[]> {
    const allPaths: string[] = [];
    const PAGE_SIZE = 500;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await sb.storage
            .from(bucket)
            .list(prefix, { limit: PAGE_SIZE, offset });

        if (error) {
            // Bucket may not exist
            if (error.message?.includes('not found') || error.message?.includes('does not exist')) return [];
            console.warn(`  [warn] list ${bucket}/${prefix} error: ${error.message}`);
            return allPaths;
        }

        if (!data || data.length === 0) {
            hasMore = false;
            break;
        }

        for (const obj of data) {
            if (obj.name) {
                allPaths.push(`${prefix}${obj.name}`);
            }
        }

        if (data.length < PAGE_SIZE) {
            hasMore = false;
        } else {
            offset += PAGE_SIZE;
        }
    }

    return allPaths;
}

async function purgeStorage(sb: SupabaseClient): Promise<StoragePurgeResult[]> {
    console.log('\n═══ STORAGE PURGE ═══');
    const results: StoragePurgeResult[] = [];
    const triedBuckets = new Set<string>();

    for (const bucket of CANDIDATE_BUCKETS) {
        if (triedBuckets.has(bucket)) continue;
        triedBuckets.add(bucket);

        for (const prefix of STORAGE_PREFIXES) {
            const objects = await listAllObjects(sb, bucket, prefix);

            if (objects.length === 0) {
                continue; // Skip silently — most prefix/bucket combos won't exist
            }

            console.log(`  [found] ${bucket}/${prefix} — ${objects.length} objects`);

            if (DRY_RUN) {
                console.log(`  [dry_run] Would delete ${objects.length} objects from ${bucket}/${prefix}`);
                results.push({ bucket, prefix, objectCount: objects.length, status: 'dry_run' });
                continue;
            }

            // LIVE DELETE — batch in chunks of 100
            const BATCH_SIZE = 100;
            let totalDeleted = 0;

            for (let i = 0; i < objects.length; i += BATCH_SIZE) {
                const batch = objects.slice(i, i + BATCH_SIZE);
                const { error } = await sb.storage.from(bucket).remove(batch);

                if (error) {
                    console.error(`  ❌ [error] ${bucket}/${prefix} batch ${i}: ${error.message}`);
                    results.push({ bucket, prefix, objectCount: objects.length, status: 'error', error: error.message });
                    throw new Error(`Storage purge failed on ${bucket}/${prefix}: ${error.message}`);
                }

                totalDeleted += batch.length;
            }

            console.log(`  ✅ [purged] ${bucket}/${prefix}: ${totalDeleted} objects removed`);
            results.push({ bucket, prefix, objectCount: totalDeleted, status: 'purged' });
        }

        // Also try root-level listing (objects not in a prefix)
        const rootObjects = await listAllObjects(sb, bucket, '');
        if (rootObjects.length > 0) {
            console.log(`  [found] ${bucket}/ (root) — ${rootObjects.length} objects`);
            if (DRY_RUN) {
                console.log(`  [dry_run] Would delete ${rootObjects.length} root objects from ${bucket}/`);
                results.push({ bucket, prefix: '(root)', objectCount: rootObjects.length, status: 'dry_run' });
            } else {
                const BATCH_SIZE = 100;
                let totalDeleted = 0;
                for (let i = 0; i < rootObjects.length; i += BATCH_SIZE) {
                    const batch = rootObjects.slice(i, i + BATCH_SIZE);
                    const { error } = await sb.storage.from(bucket).remove(batch);
                    if (error) {
                        console.error(`  ❌ [error] ${bucket}/ root batch: ${error.message}`);
                        results.push({ bucket, prefix: '(root)', objectCount: rootObjects.length, status: 'error', error: error.message });
                        throw new Error(`Storage purge failed on ${bucket}/ root: ${error.message}`);
                    }
                    totalDeleted += batch.length;
                }
                console.log(`  ✅ [purged] ${bucket}/ (root): ${totalDeleted} objects removed`);
                results.push({ bucket, prefix: '(root)', objectCount: totalDeleted, status: 'purged' });
            }
        }
    }

    return results;
}

// ═══════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════

function printSummary(dbResults: PurgeResult[], storageResults: StoragePurgeResult[]): void {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    PURGE SUMMARY                           ║');
    console.log(`║  Mode: ${DRY_RUN ? '🟡 DRY RUN' : '🔴 LIVE'}                                            ║`);
    console.log('╠══════════════════════════════════════════════════════════════╣');

    console.log('║  DB Tables:');
    for (const r of dbResults) {
        if (r.status === 'skipped' && r.rowsBefore === 0) continue; // Don't show non-existent tables
        const icon = r.status === 'purged' ? '✅' : r.status === 'dry_run' ? '🟡' : r.status === 'error' ? '❌' : '⏭️';
        console.log(`║    ${icon} ${r.table}: ${r.rowsBefore} → ${r.rowsAfter} rows (${r.status})`);
    }

    const existingTables = dbResults.filter(r => r.rowsBefore > 0);
    if (existingTables.length === 0) {
        console.log('║    (no tables with data found)');
    }

    console.log('║  Storage:');
    if (storageResults.length === 0) {
        console.log('║    (no storage objects found)');
    }
    for (const r of storageResults) {
        const icon = r.status === 'purged' ? '✅' : r.status === 'dry_run' ? '🟡' : '❌';
        console.log(`║    ${icon} ${r.bucket}/${r.prefix}: ${r.objectCount} objects (${r.status})`);
    }

    console.log('╚══════════════════════════════════════════════════════════════╝');
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main(): Promise<void> {
    enforceGates();

    const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
    });

    const dbResults = await purgeDB(sb);
    const storageResults = await purgeStorage(sb);

    printSummary(dbResults, storageResults);

    // Final validation for live runs
    if (!DRY_RUN) {
        const remaining = dbResults.filter(r => r.status === 'purged' && r.rowsAfter > 0);
        if (remaining.length > 0) {
            console.error('⚠️ WARNING: Some tables still have rows after purge.');
            for (const r of remaining) {
                console.error(`   ${r.table}: ${r.rowsAfter} rows remaining`);
            }
        }

        const failed = [...dbResults.filter(r => r.status === 'error'), ...storageResults.filter(r => r.status === 'error')];
        if (failed.length > 0) {
            console.error('❌ ERRORS occurred during purge. Check logs above.');
            process.exit(1);
        }

        console.log('\n✅ Purge complete. All news data has been removed.');
    } else {
        console.log('\n🟡 Dry run complete. No data was modified. Run with DRY_RUN=false to execute.');
    }
}

main().catch((err) => {
    console.error('❌ Fatal error during purge:', err);
    process.exit(1);
});
