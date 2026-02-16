
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = process.env.SUPABASE_NEWS_BUCKET || 'images';

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runAudit() {
    console.log('--- A. DATABASE AUDIT ---');

    // 1. Total Count
    const { count: totalCount, error: countError } = await supabase
        .from('news')
        .select('*', { count: 'exact', head: true });

    if (countError) console.error('Error getting total count:', countError);
    console.log(`Total News Items: ${totalCount}`);

    // 2. Group by Image Status
    const { data: statusData, error: statusError } = await supabase
        .from('news')
        .select('image_status');

    if (statusError) console.error('Error getting status data:', statusError);

    const statusCounts: Record<string, number> = {};
    let nullStatusCount = 0;

    statusData?.forEach(row => {
        const s = row.image_status;
        if (s === null) {
            nullStatusCount++;
        } else {
            statusCounts[s] = (statusCounts[s] || 0) + 1;
        }
    });

    console.log('Image Status Distribution:');
    console.log(JSON.stringify(statusCounts, null, 2));
    console.log(`NULL status: ${nullStatusCount}`);

    // 3. Image URL IS NULL
    const { count: nullUrlCount } = await supabase
        .from('news')
        .select('*', { count: 'exact', head: true })
        .is('image_url', null);
    console.log(`Items with image_url IS NULL: ${nullUrlCount}`);

    // 4. Image Prompt IS NULL
    const { count: nullPromptCount } = await supabase
        .from('news')
        .select('*', { count: 'exact', head: true })
        .is('image_prompt', null);
    console.log(`Items with image_prompt IS NULL: ${nullPromptCount}`);

    // 5. Image Source Type
    const { data: sourceTypeData } = await supabase
        .from('news')
        .select('image_source_type');

    const sourceCounts: Record<string, number> = {};
    let nullSourceCount = 0;
    sourceTypeData?.forEach(row => {
        const s = row.image_source_type;
        if (s === null) nullSourceCount++;
        else sourceCounts[s] = (sourceCounts[s] || 0) + 1;
    });
    console.log('Image Source Type Distribution:');
    console.log(JSON.stringify(sourceCounts, null, 2));
    console.log(`NULL source type: ${nullSourceCount}`);

    console.log('\n--- B. GENERATION ATTEMPTS ---');
    const { data: attemptsData } = await supabase
        .from('news')
        .select('image_generation_attempts');

    const attemptsDist: Record<string, number> = {};
    attemptsData?.forEach(row => {
        const a = row.image_generation_attempts || 0;
        attemptsDist[a] = (attemptsDist[a] || 0) + 1;
    });
    console.log('Attempts Distribution:');
    console.log(JSON.stringify(attemptsDist, null, 2));

    // Attempts = 0 but status != placeholder (and not null)
    const { count: unexpectedZeroAttempts } = await supabase
        .from('news')
        .select('*', { count: 'exact', head: true })
        .eq('image_generation_attempts', 0)
        .neq('image_status', 'placeholder')
        .not('image_status', 'is', null);
    console.log(`Attempts=0 but status!=placeholder (suspicious): ${unexpectedZeroAttempts}`);

    console.log('\n--- C. STUCK STATES ---');
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { count: stuckCount, data: stuckItems } = await supabase
        .from('news')
        .select('id, updated_at', { count: 'exact' })
        .eq('image_status', 'generating')
        .lt('updated_at', thirtyMinutesAgo);

    console.log(`Stuck 'generating' (>30m): ${stuckCount}`);
    if (stuckItems && stuckItems.length > 0) {
        console.log('Sample stuck IDs:', stuckItems.slice(0, 5).map(i => i.id));
    }

    console.log('\n--- 2. STORAGE AUDIT ---');
    console.log(`Bucket: ${BUCKET_NAME}`);

    try {
        let allFiles: any[] = [];
        let offset = 0;
        const limit = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data: files, error } = await supabase.storage.from(BUCKET_NAME).list('', {
                limit,
                offset,
                sortBy: { column: 'name', order: 'asc' }
            });

            if (error) throw error;
            if (files && files.length > 0) {
                allFiles = allFiles.concat(files);
                offset += files.length;
                if (files.length < limit) hasMore = false;
            } else {
                hasMore = false;
            }
        }

        console.log(`Total Files: ${allFiles.length}`);
        if (allFiles.length > 0) {
            // Sort by created_at or updated_at (metadata) usually needed, but list() returns metadata
            // list() items have id, name, metadata, created_at, updated_at, last_accessed_at

            // Sort to find oldest/newest
            allFiles.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

            console.log(`Oldest File: ${allFiles[0].name} (${allFiles[0].created_at})`);
            console.log(`Newest File: ${allFiles[allFiles.length - 1].name} (${allFiles[allFiles.length - 1].created_at})`);

            // Analyze prefixes
            const prefixes: Record<string, number> = {};
            allFiles.forEach(f => {
                const parts = f.name.split('_'); // Rough heuristic
                const prefix = parts[0];
                prefixes[prefix] = (prefixes[prefix] || 0) + 1;
            });
            // Just show top 5 prefixes to avoid spam
            const sortedPrefixes = Object.entries(prefixes).sort((a, b) => b[1] - a[1]).slice(0, 5);
            console.log('Top Filename Patterns (Prefixes):');
            console.log(sortedPrefixes);

        }
    } catch (e: any) {
        console.error('Storage Audit Failed:', e.message);
    }
}

runAudit().catch(e => console.error(e));
