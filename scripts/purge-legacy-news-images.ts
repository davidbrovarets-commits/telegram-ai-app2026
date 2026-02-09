import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

function mustGetEnv(name: string): string {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env: ${name}`);
    return v;
}

function parseStoragePathFromPublicUrl(url: string): string | null {
    // Expecting something like: https://<project>.supabase.co/storage/v1/object/public/<bucket>/news/<file>.png
    try {
        const u = new URL(url);
        const parts = u.pathname.split('/').filter(Boolean);
        const idx = parts.findIndex(p => p === 'public');
        if (idx === -1) return null;
        // parts: ... /object/public/<bucket>/<path...>
        const bucket = parts[idx + 1];
        const rest = parts.slice(idx + 2).join('/');
        if (!bucket || !rest) return null;
        if (!rest.startsWith('news/')) return null;
        return rest;
    } catch {
        return null;
    }
}

async function main() {
    const SUPABASE_URL = mustGetEnv('VITE_SUPABASE_URL'); // Using VITE_ as it's common in this project, fallback to SUPABASE_URL if needed in logical check
    const SUPABASE_SERVICE_ROLE_KEY = mustGetEnv('SUPABASE_SERVICE_ROLE_KEY');
    const BUCKET = (process.env.SUPABASE_NEWS_BUCKET || 'images').trim();
    const PURGE_DRY_RUN = (process.env.PURGE_DRY_RUN || '').trim().toLowerCase();
    const IS_DRY = ['1', 'true', 'yes', 'on'].includes(PURGE_DRY_RUN);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('=== purge-legacy-news-images ===');
    console.log(`[Purge] Bucket=${BUCKET}`);
    console.log(`[Purge] DryRun=${IS_DRY ? 'ON' : 'OFF'}`);

    // Pull candidates
    const { data, error } = await supabase
        .from('news')
        .select('id, image_status, image_url, image_prompt')
        .eq('image_status', 'generated')
        .limit(2000);

    if (error) throw error;

    const items = data || [];
    let legacy = 0;
    let deleted = 0;
    let reset = 0;
    let delFail = 0;
    let updFail = 0;

    for (const it of items) {
        const prompt = (it.image_prompt || '');
        const url = (it.image_url || '');

        const isLegacy =
            !prompt ||
            !prompt.includes('Exclude:') ||
            (!prompt.includes('f/2.8 aperture') && !prompt.includes('f/8 aperture')) ||
            (!prompt.includes('35mm lens') && !prompt.includes('50mm lens'));

        if (!isLegacy) continue;
        legacy++;

        const objPath = url ? parseStoragePathFromPublicUrl(url) : null;

        console.log(`[Legacy] id=${it.id} objPath=${objPath || 'n/a'} url=${url ? 'yes' : 'no'}`);

        if (IS_DRY) continue;

        // Delete storage object if possible
        if (objPath) {
            const { error: delErr } = await supabase.storage.from(BUCKET).remove([objPath]);
            if (delErr) {
                delFail++;
                console.warn(`[DeleteFail] id=${it.id} path=${objPath} err=${delErr.message}`);
            } else {
                deleted++;
            }
        }

        // Reset DB row for regeneration
        const { error: updErr } = await supabase
            .from('news')
            .update({
                image_status: 'placeholder',
                image_url: null,
                image_prompt: null,
                image_source_type: null,
                image_source_url: null,
                image_source_license: null,
                image_source_attribution: null,
                image_error: null,
                image_generation_attempts: 0,
                image_last_attempt_at: null,
                image_generated_at: null,
            })
            .eq('id', it.id);

        if (updErr) {
            updFail++;
            console.warn(`[UpdateFail] id=${it.id} err=${updErr.message}`);
        } else {
            reset++;
        }
    }

    console.log('=== purge summary ===');
    console.log(`scanned=${items.length} legacy=${legacy} deleted=${deleted} reset=${reset} delFail=${delFail} updFail=${updFail}`);
    console.log('DONE');
}

main().catch((e) => {
    console.error('FATAL', e);
    process.exit(1);
});
