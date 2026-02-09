import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// --- CONFIGURATION ---
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = process.env.SUPABASE_NEWS_BUCKET || 'images'; // Default bucket
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

async function main() {
    console.log('=== LEGACY IMAGE PURGE TOOL ===');
    console.log(`Bucket: ${BUCKET_NAME}`);
    console.log(`Mode: ${APPROVE_DELETE ? '🔴 DELETE (APPROVED)' : '🟢 DRY RUN (LIST ONLY)'}`);

    // 1. List all files in bucket
    console.log('\n--- Scanning Storage ---');
    const { data: files, error: listError } = await supabase.storage.from(BUCKET_NAME).list('', { limit: 1000, sortBy: { column: 'name', order: 'asc' } });

    if (listError) {
        console.error('Failed to list files:', listError);
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

    const validUrls = new Set(items?.map(i => i.image_url) || []);
    console.log(`Found ${validUrls.size} valid referenced URLs in DB.`);

    // 3. Identify Orphans
    const orphans: OrphanFile[] = [];

    for (const file of files) {
        // Construct public URL (assuming standard pattern, might need adjustment based on project config)
        // Standard Supabase pattern: .../storage/v1/object/public/{bucket}/{name}
        // BUT we can just check if the filename exists in any valid URL
        // A safer check: Does any valid URL end with this filename?

        // Definition of "Legacy":
        // 1. Not in "news/" folder? (If we enforce new structure) - assuming flat for now based on current knowledge or check prefixes.
        // 2. Not referenced in DB.

        const isReferenced = Array.from(validUrls).some(url => url?.includes(file.name));

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
    if (APPROVE_DELETE && orphans.length > 0) {
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
    } else if (orphans.length > 0) {
        console.log('\n⚠️  To DELETE, set env LEGACY_PURGE_APPROVE=true');
    }
}

main();
