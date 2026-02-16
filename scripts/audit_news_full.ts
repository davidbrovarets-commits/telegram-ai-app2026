
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = process.env.SUPABASE_NEWS_BUCKET || 'images';

// Helpers
const log = (section: string, data: any) => console.log(`\n### ${section}\n`, JSON.stringify(data, null, 2));
const err = (section: string, msg: string) => console.log(`\n### ${section}\n`, { error: msg });

async function runAudit() {
    console.log('--- STARTING NEWS FULL AUDIT ---');

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        err('CONFIGURATION', 'Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
        return;
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    try {
        // 1. NEWS INVENTORY
        // Total
        const { count: totalCount, error: countErr } = await supabase.from('news').select('*', { count: 'exact', head: true });
        if (countErr) throw countErr;

        // By Level (Country, Land, City)
        // Note: Supabase doesn't support GROUP BY in simple client query easily without rpc, 
        // fallback to fetching relevant columns if count is small, or just using separate queries for known values if possible.
        // We'll try to fetch all 'land' and 'city' fields to aggregate in memory (assuming dataset < 10k, otherwise problematic).
        // If dataset is huge, this is bad. But usually news items are in hundreds/thousands.

        const { data: allItems, error: dataErr } = await supabase.from('news').select('id, land, city, image_status, image_url, published_at, image_source_type');
        if (dataErr) throw dataErr;

        const inventory = {
            total: totalCount,
            levels: {
                COUNTRY: 0,
                BUNDESLAND: 0,
                CITY: 0
            },
            geo: {} as Record<string, { total: number, cities: Set<string> }>
        };

        const imageStats = {
            withImage: 0,
            withoutImage: 0,
            stuckProcessing: 0, // 'generating'
            imagen4: 0,
            otherSource: 0,
            statusBreakdown: {} as Record<string, number>
        };

        const freshness = {
            oldest: null as string | null,
            newest: null as string | null,
            dates: [] as number[], // for avg calculation
            staleCount72h: 0
        };

        const leipzig = {
            total: 0,
            withImage: 0,
            oldest: null as string | null,
            newest: null as string | null,
            visible: 0 // Assume all in DB are visible unless 'status' field says otherwise (we didn't query separate 'status' column, assuming draft check if exists)
        };

        const now = Date.now();
        const staleThreshold = 72 * 60 * 60 * 1000;

        allItems?.forEach(item => {
            // Inventory
            if (item.city) inventory.levels.CITY++;
            else if (item.land) inventory.levels.BUNDESLAND++;
            else inventory.levels.COUNTRY++; // Assumption: fallback to country if no city/land

            // Geo Aggregation
            const land = item.land || 'Unknown';
            if (!inventory.geo[land]) inventory.geo[land] = { total: 0, cities: new Set() };
            inventory.geo[land].total++;
            if (item.city) inventory.geo[land].cities.add(item.city);

            // Image Coverage
            if (item.image_url) imageStats.withImage++;
            else imageStats.withoutImage++;

            const status = item.image_status || 'NULL';
            imageStats.statusBreakdown[status] = (imageStats.statusBreakdown[status] || 0) + 1;

            if (status === 'generating') imageStats.stuckProcessing++;
            if (item.image_source_type === 'imagen') imageStats.imagen4++;
            else if (item.image_source_type) imageStats.otherSource++;

            // Freshness
            if (item.published_at) {
                const date = new Date(item.published_at).getTime();
                freshness.dates.push(date);
                if (!freshness.oldest || item.published_at < freshness.oldest) freshness.oldest = item.published_at;
                if (!freshness.newest || item.published_at > freshness.newest) freshness.newest = item.published_at;

                if (now - date > staleThreshold) freshness.staleCount72h++;
            }

            // Leipzig
            if (item.city && item.city.toLowerCase().includes('leipzig')) {
                leipzig.total++;
                if (item.image_url) leipzig.withImage++;
                if (!leipzig.oldest || item.published_at < leipzig.oldest) leipzig.oldest = item.published_at;
                if (!leipzig.newest || item.published_at > leipzig.newest) leipzig.newest = item.published_at;
                leipzig.visible++; // Assuming presence = visible for now
            }
        });

        // Convert Set to count for JSON output
        const geoOutput: Record<string, any> = {};
        for (const [k, v] of Object.entries(inventory.geo)) {
            geoOutput[k] = { total: v.total, cityCount: v.cities.size, cities: Array.from(v.cities) };
        }

        // Calculate Average Age
        const avgAgeHours = freshness.dates.length
            ? ((now - (freshness.dates.reduce((a, b) => a + b, 0) / freshness.dates.length)) / (1000 * 60 * 60)).toFixed(1)
            : 'N/A';

        log('1_NEWS_INVENTORY', { total: inventory.total, levels: inventory.levels });
        log('2_IMAGE_COVERAGE', {
            coveragePercent: totalCount ? ((imageStats.withImage / totalCount) * 100).toFixed(1) + '%' : '0%',
            stats: imageStats
        });
        log('4_GEO_COVERAGE', geoOutput);
        log('5_FRESHNESS', {
            oldest: freshness.oldest,
            newest: freshness.newest,
            avgAgeHours,
            staleItems: freshness.staleCount72h
        });
        log('6_LEIPZIG_VIEW', leipzig);

    } catch (e: any) {
        err('DATABASE', `Query failed: ${e.message}`);
    }

    // Storage Audit
    try {
        const { data: files, error: storageErr } = await supabase.storage.from(BUCKET_NAME).list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
        if (storageErr) throw storageErr;

        log('STORAGE_SAMPLE', {
            bucket: BUCKET_NAME,
            fileCountSample: files?.length,
            newestFile: files?.[0]?.name,
            oldestFileSample: files?.[files.length - 1]?.name
        });
    } catch (e: any) {
        err('STORAGE', `List failed: ${e.message}`);
    }
}

runAudit();
