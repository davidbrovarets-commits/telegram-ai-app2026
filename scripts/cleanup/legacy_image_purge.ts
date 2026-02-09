import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// --- CONFIGURATION ---
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Fail-fast if bucket missing
if (!process.env.SUPABASE_NEWS_BUCKET) {
    console.error('❌ Missing SUPABASE_NEWS_BUCKET env var');
    process.exit(1);
}
const BUCKET_NAME = process.env.SUPABASE_NEWS_BUCKET;
const APPROVE_DELETE = process.env.LEGACY_PURGE_APPROVE === 'true';

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface OrphanFile {
    name: string;
    reason: string;
}

async function listAllFiles(bucket: string): Promise<any[]> {
    let allFiles: any[] = [];
    let offset = 0;
    const limit = 1000;
    let hasMore = true;

    while (hasMore) {
        console.log(`Listing files offset=${offset}...`);
        const { data: files, error } = await supabase.storage.from(bucket).list('', {
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
    return allFiles;
}

async function main() {
    console.log('=== LEGACY IMAGE PURGE TOOL ===');
    console.log(`Bucket: ${BUCKET_NAME}`);
    console.log(`Mode: ${APPROVE_DELETE ? '🔴 DELETE (APPROVED)' : '🟢 DRY RUN (LIST ONLY)'}`);

    // 1. List all files in bucket
    console.log('\n--- Scanning Storage ---');
    let files: any[] = [];
    try {
        files = await listAllFiles(BUCKET_NAME);
    } catch (e: any) {
        console.error('Failed to list files:', e.message);
        process.exit(1);
    }

    if (!files || files.length === 0) {
        console.log('No files found in bucket.');
        return;
    }

    console.log(`Found ${files.length} files in bucket.`);

    // 2. Get all valid image URLs from DB
    console.log('\n--- Scanning Database ---');
    const { data: items, error: dbError } = await supabase
        .from('news')
        .select('image_url')
        .not('image_url', 'is', null);

    if (dbError) {
        console.error('Failed to query DB:', dbError);
        process.exit(1);
    }

    // Clean URLs for strict matching
    const validUrls = new Set(items?.map(i => {
        if (!i.image_url) return '';
        try {
            // Strip query params if any
            const urlObj = new URL(i.image_url);
            return urlObj.pathname;
        } catch (e) {
            // If not a full URL, use as is (removing query part manually)
            return i.image_url.split('?')[0];
        }
    }) || []);

    console.log(`Found ${validUrls.size} valid referenced URLs in DB.`);

    // 3. Identify Orphans
    const orphans: OrphanFile[] = [];

    for (const file of files) {
        // Strict matching: Check if the filename appears at the end of any valid URL path
        const fileName = file.name;

        let isReferenced = false;
        for (const urlPath of validUrls) {
            if (urlPath && (urlPath.endsWith('/' + fileName) || urlPath.endsWith(fileName) || urlPath === fileName)) {
                isReferenced = true;
                break;
            }
        }

        if (!isReferenced) {
            orphans.push({ name: file.name, reason: 'Not referenced in DB' });
        }
    }

    console.log(`\nFound ${orphans.length} orphan/legacy files.`);

    // Output List
    if (orphans.length > 0) {
        fs.writeFileSync('legacy-delete-list.json', JSON.stringify(orphans, null, 2));
        console.log('Saved list to legacy-delete-list.json');

        // Log sample
        orphans.slice(0, 10).forEach(o => console.log(` - ${o.name} (${o.reason})`));
        if (orphans.length > 10) console.log(`... and ${orphans.length - 10} more.`);
    }

    // 4. Delete if Approved
    if (APPROVE_DELETE) {
        if (orphans.length > 0) {
            console.log('\n--- DELETING FILES ---');
            // Delete in batches
            const batchSize = 20;
            for (let i = 0; i < orphans.length; i += batchSize) {
                const batch = orphans.slice(i, i + batchSize).map(o => o.name);
                console.log(`Deleting batch ${i + 1}-${Math.min(i + batchSize, orphans.length)}...`);

                const { error: delError } = await supabase.storage.from(BUCKET_NAME).remove(batch);
                if (delError) {
                    console.error('Error deleting batch:', delError);
                }
            }
            console.log('Purge complete.');
        } else {
            console.log('No orphans to delete.');
        }
    } else if (orphans.length > 0) {
        console.log('\n⚠️  To DELETE, set env LEGACY_PURGE_APPROVE=true');
    }
}

main().catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
});
