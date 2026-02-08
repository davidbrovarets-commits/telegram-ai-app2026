
import { supabase } from './supabaseClient';
import { claimNewsForGeneration, markImageGenerated, markImageFailed, releaseImageLock, NewsItemImageState } from './lib/imageStatus';

// Environment check for Google Auth
import { GoogleAuth } from 'google-auth-library';
import { execSync } from 'child_process';

const PROJECT_ID = process.env.GOOGLE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'claude-vertex-prod';
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
const MODEL_ID = 'imagen-4.0-generate-001';
const BUCKET_NAME = process.env.SUPABASE_NEWS_BUCKET || 'images';

// Configurable Overrides (PATCH 2.1.1: Robust Parsing & Clamping)
const DEFAULT_BATCH_SIZE = 5;
const RAW_BATCH_SIZE_STR = (process.env.NEWS_IMAGES_BATCH_SIZE || '').trim();
const RAW_BATCH_SIZE = Number.parseInt(RAW_BATCH_SIZE_STR || String(DEFAULT_BATCH_SIZE), 10);
const BATCH_SIZE_UNCLAMPED = Number.isFinite(RAW_BATCH_SIZE) ? RAW_BATCH_SIZE : DEFAULT_BATCH_SIZE;
const BATCH_SIZE = Math.min(50, Math.max(1, BATCH_SIZE_UNCLAMPED));

// Robust Dry Run Parsing (PATCH 2.1.1)
const DRY_RUN_RAW = (process.env.NEWS_IMAGES_DRY_RUN_PROMPT || '').trim().toLowerCase();
const IS_DRY_RUN = ['true', '1', 'yes', 'on'].includes(DRY_RUN_RAW);

/**
 * 1. Reference Image Logic (Wikipedia) - ORIGINAL SIMPLE LOGIC
 */
async function findReferenceImage(query: string): Promise<{ url: string; license: string; attribution: string } | null> {
    try {
        // Search Wikipedia API for page
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
        const searchRes = await fetch(searchUrl);
        const searchData: any = await searchRes.json();

        if (!searchData.query?.search?.length) return null;

        const title = searchData.query.search[0].title;

        // Get Page Images
        const imgUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages|pageterms&pithumbsize=1000&format=json&origin=*`;
        const imgRes = await fetch(imgUrl);
        const imgData: any = await imgRes.json();

        const pages = imgData.query?.pages;
        if (!pages) return null;
        const pageId = Object.keys(pages)[0];
        const page = pages[pageId];

        if (page.thumbnail?.source) {
            return {
                url: page.thumbnail.source,
                license: 'Wikimedia',
                attribution: `Source: Wikipedia (${title})`
            };
        }
    } catch (e) {
        console.warn('Error fetching reference image:', e);
    }
    return null;
}

/**
 * 2. Imagen 4 Logic - ORIGINAL SIMPLE LOGIC
 */
async function generateImagen4(prompt: string): Promise<string | null> {
    try {
        let accessToken = process.env.GOOGLE_ACCESS_TOKEN;

        // Auth Fallback: gcloud CLI
        if (!accessToken) {
            try {
                // Hotfix: Use portable command, relying on PATH
                const gcloudCmd = 'gcloud auth print-access-token';
                accessToken = execSync(gcloudCmd).toString().trim();
            } catch (e) {
                // Ignore silent fail, try GoogleAuth
            }
        }

        // Auth Fallback: Application Default Credentials
        if (!accessToken) {
            const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
            const client = await auth.getClient();
            accessToken = (await client.getAccessToken()).token || undefined;
        }

        if (!accessToken) throw new Error('No Google Access Token found.');

        const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1beta1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}:predict`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                instances: [{ prompt: prompt }],
                parameters: {
                    sampleCount: 1,
                    aspectRatio: "16:9", // Keep original 16:9 for Patch 0
                    outputOptions: { mimeType: "image/png" }
                }
            })
        });

        if (!response.ok) {
            const txt = await response.text();
            throw new Error(`Vertex AI Error ${response.status}: ${txt}`);
        }

        const data: any = await response.json();
        return data.predictions?.[0]?.bytesBase64Encoded || null;

    } catch (e: any) {
        console.error('Imagen generation failed:', e.message);
        return null;
    }
}

/**
 * 3. Supabase Storage Upload
 */
async function uploadToStorage(base64OrUrl: string, isUrl: boolean, itemId: number): Promise<string | null> {
    try {
        let buffer: Buffer;
        let mimeType = 'image/png';

        if (isUrl) {
            const res = await fetch(base64OrUrl);
            if (!res.ok) throw new Error('Failed to download reference image');

            // Quality Gate - Size Check
            const arrayBuf = await res.arrayBuffer();
            buffer = Buffer.from(arrayBuf);

            if (buffer.length < 50 * 1024) { // 50KB min
                throw new Error(`Reference image too small (${Math.round(buffer.length / 1024)}KB < 50KB)`);
            }

            const ct = res.headers.get('content-type');
            if (ct) mimeType = ct;
        } else {
            buffer = Buffer.from(base64OrUrl, 'base64');
        }

        const filePath = `news/${itemId}_${Date.now()}.png`;

        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, buffer, { contentType: mimeType, upsert: true });

        if (error) throw error;

        const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
        return publicUrlData.publicUrl;

    } catch (e) {
        console.error('Upload failed:', e);
        return null;
    }
}

/**
 * MAIN: Process Single Item
 */
async function processItem(item: NewsItemImageState) {
    console.log(`[Job] Processing item ${item.id}...`);

    try {
        // A. Get details
        const { data: fullItem, error } = await supabase
            .from('news')
            .select('title, content, uk_summary, city, land, source, published_at, link')
            .eq('id', item.id)
            .single();

        if (error || !fullItem) throw new Error('Item data not found');

        // B. Try Reference (Wikipedia)
        const searchQuery = fullItem.title.split(' ').slice(0, 5).join(' ');
        const refImage = await findReferenceImage(searchQuery);

        if (refImage) {
            console.log(`[Job] Found reference image for ${item.id}`);
            const publicUrl = await uploadToStorage(refImage.url, true, item.id);

            if (publicUrl) {
                await markImageGenerated(supabase, item.id, {
                    image_url: publicUrl,
                    image_source_type: 'reference',
                    image_source_url: refImage.url,
                    image_source_attribution: refImage.attribution
                });
                return;
            }
        }

        // C. Fallback: Imagen 4 (Simple Original Prompt)
        console.log(`[Job] Generating Imagen 4 for ${item.id}`);
        const contextText = fullItem.uk_summary || fullItem.content || '';
        const shortContext = contextText.substring(0, 150).replace(/\n/g, ' ');
        const location = fullItem.city || fullItem.land || '';

        const simplePrompt = `A documentary photo of ${fullItem.title}. ${location ? `Location: ${location}.` : ''} ${shortContext}. Realistic, neutral, high quality.`;
        const strictPrompt = `${simplePrompt} No text. No logos. No watermarks. Not an illustration. Not a cartoon. No propaganda. No stereotypes. No distorted faces. No uncanny people.`;

        // OBSERVABILITY LOGGING (PATCH 2)
        console.log('--- PROMPT START ---');
        console.log(strictPrompt);
        console.log('--- PROMPT END ---');
        console.log(`[Job] Config: Batch=${BATCH_SIZE}, Attempts=${item.image_generation_attempts}, Ref=${!!refImage ? 'Yes' : 'No'}`);

        // DRY RUN CHECK (PATCH 2.1 - Robust)
        if (IS_DRY_RUN) {
            console.log('[DryRun] Skipping Imagen call.');
            await releaseImageLock(supabase, item.id, 'dry-run');
            return;
        }

        const b64 = await generateImagen4(strictPrompt);
        if (b64) {
            const publicUrl = await uploadToStorage(b64, false, item.id);
            if (publicUrl) {
                await markImageGenerated(supabase, item.id, {
                    image_url: publicUrl,
                    image_source_type: 'imagen',
                    image_prompt: strictPrompt
                });
                return;
            }
        }

        throw new Error('All generation methods failed');

    } catch (e: any) {
        console.error(`[Job] Failed item ${item.id}:`, e.message);
        await markImageFailed(supabase, item.id, e.message, item.image_generation_attempts);
    }
}

/**
 * LOOP
 */
async function run() {
    console.log('=== Starting News Image Pipeline ===');
    console.log(`[Job] DryRun = ${IS_DRY_RUN ? 'ON' : 'OFF'} (raw="${process.env.NEWS_IMAGES_DRY_RUN_PROMPT || ''}")`);
    console.log(`[Job] Batch size = ${BATCH_SIZE} (Effective)`);
    const items = await claimNewsForGeneration(supabase, BATCH_SIZE);
    console.log(`[Job] Claimed ${items.length} items`);

    for (const item of items) {
        await processItem(item);
    }
    console.log('=== Batch Complete ===');
}

run().catch(console.error);
