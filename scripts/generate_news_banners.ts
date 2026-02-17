import { supabase } from './supabaseClient';
import { claimNewsForGeneration, markImageGenerated, markImageFailed, releaseImageLock, NewsItemImageState, MAX_GENERATION_ATTEMPTS } from './lib/imageStatus';
import { vertexClient } from './utils/vertex-client';
import { assertMutationAllowed, isDryRun } from './lib/mutation-guard';
import { limits } from './lib/limits';
import { metrics } from './lib/run-metrics';
import { withRetry } from './lib/retry';

const BUCKET_NAME = process.env.SUPABASE_NEWS_BUCKET || 'images';

// Configurable Overrides (PATCH 2.1.1: Robust Parsing & Clamping)
const DEFAULT_BATCH_SIZE = 5;
const RAW_BATCH_SIZE_STR = (process.env.NEWS_IMAGES_BATCH_SIZE || '').trim();
const RAW_BATCH_SIZE = Number.parseInt(RAW_BATCH_SIZE_STR || String(DEFAULT_BATCH_SIZE), 10);
const BATCH_SIZE_UNCLAMPED = Number.isFinite(RAW_BATCH_SIZE) ? RAW_BATCH_SIZE : DEFAULT_BATCH_SIZE;
const BATCH_SIZE = Math.min(50, Math.max(1, BATCH_SIZE_UNCLAMPED));

// Robust Dry Run Parsing
const IS_DRY_RUN = isDryRun();

// --- SAFETY & RELIABILITY ---
const MAX_IMAGES_PER_RUN = limits.MAX_IMAGE_GENS_PER_RUN; // Centralized Limit directly
const MAX_CONCURRENCY = Math.min(4, Math.max(1, Number(process.env.MAX_CONCURRENCY || 2)));
const MAX_RETRIES = Math.min(3, Math.max(0, Number(process.env.MAX_RETRIES || 2)));
const SAFETY_ABORT_THRESHOLD = Math.min(100, Math.max(5, Number(process.env.SAFETY_ABORT_THRESHOLD || 30)));

console.log("SAFETY CONFIG:");
console.log("MAX_IMAGES_PER_RUN:", MAX_IMAGES_PER_RUN);
console.log("MAX_CONCURRENCY:", MAX_CONCURRENCY);

// --- PATCH 3: CONSTANTS & VALIDATION ---
const MANDATORY_REALISM_TOKENS = [
    'film grain', 'chromatic aberration', 'dust particles', 'subtle motion blur'
];
const MANDATORY_LIGHTING_TOKENS = [
    'cinematic lighting', 'rim lighting', 'chiaroscuro lighting', 'natural diffused lighting'
];
const MANDATORY_LENS_TOKENS = ['35mm lens', '50mm lens'];
const MANDATORY_APERTURE_TOKENS = ['f/2.8 aperture', 'f/8 aperture'];

const NEGATIVE_PROMPTS = "Blurry. Low quality. Distorted text. Watermark. Oversaturated. Anatomically incorrect. No text. No logos. Not an illustration. No propaganda. No distorted faces. No uncanny people.";

/**
 * Helper: Build Contract-Compliant Fallback Prompt
 */
function buildFallbackPrompt(title: string, location: string): string {
    const locStr = location ? `The scene is set in ${location}, providing a grounded and authentic atmosphere.` : 'The setting is atmospheric and grounded.';
    return `A realistic documentary photograph capturing the essence of "${title}". ${locStr} The image focuses on symbolic elements representing the core news story, avoiding specific real-world individuals in favor of representative figures or objects. The composition is balanced and professional, typical of high-end photojournalism. Lighting plays a key role, with cinematic lighting casting dramatic shadows and highlighting the central subject matter. The aesthetic is strictly documentary, with no artificial or illustrative elements. Shot with a 35mm lens, the field of view feels natural and immersive. An f/8 aperture ensures a sharp depth of field, keeping the context visible. Subtle film grain adds a layer of texture and realism to the final image. This photograph aims to convey the gravity and significance of the event through visual storytelling, maintaining a neutral and objective observer perspectives.`;
}

/**
 * 0. Gemini Flash Prompt Builder
 */
async function generatePromptWithGemini(context: string, title: string, location: string): Promise<string> {
    try {
        const systemInstruction = `You are an expert Art Director for a serious News Application.
Your task is to describe a compelling, realistic, documentary-style photograph based on a news story.

CONTRACT:
1. OUTPUT: Single paragraph (100-200 words).
2. FORMULA (Golden Rule) - You MUST follow this order:
   [Subject] -> [Context] -> [Lighting] -> [Style] -> [Technical Parameters]

DETAILS:
- Subject: Representative, symbolic (e.g. microphones, buildings, silhouettes). IF REAL PERSON IN TITLE: Do NOT depict them directly. Use symbols.
- Context: Atmospheric setting (${location || 'relevant background'}).
- Lighting: MUST include ONE of: ${MANDATORY_LIGHTING_TOKENS.join(', ')}.
- Style: "Documentary photography".
- Technical: "35mm lens" or "50mm lens", "f/2.8 aperture" or "f/8 aperture".
- Realism: MUST include exactly 1-2 of these tokens: ${MANDATORY_REALISM_TOKENS.join(', ')}.

SAFETY:
- Illustrative documentary-style only.
- NO text generation instructions.
- NO reconstruction of crimes/accidents.
- NO new facts. Structural rewrite only.`;

        const userPrompt = `News Title: "${title}"
News Content: "${context}"

Describe the photo now.`;

        // Use VertexClient for text generation with retry
        const text = await withRetry(() => vertexClient.generateText(systemInstruction + '\n\n' + userPrompt, 0.7), { retries: 2 });
        return text.trim();

    } catch (e: unknown) {
        console.warn('Gemini Flash prompt generation failed, falling back to compliant template.', e);
        return buildFallbackPrompt(title, location);
    }
}

/**
 * Validation Helper
 */
function validatePrompt(prompt: string): { valid: boolean; reason?: string } {
    const p = prompt.toLowerCase();
    const wordCount = prompt.split(/\s+/).length;
    if (wordCount < 100) return { valid: false, reason: `Too short (${wordCount} < 100 words)` };
    if (wordCount > 200) return { valid: false, reason: `Too long (${wordCount} > 200 words)` };

    const hasLighting = MANDATORY_LIGHTING_TOKENS.some(t => p.includes(t));
    if (!hasLighting) return { valid: false, reason: 'Missing mandatory Lighting token' };

    const realismCount = MANDATORY_REALISM_TOKENS.filter(t => p.includes(t)).length;
    if (realismCount < 1) return { valid: false, reason: 'Missing mandatory Realism token' };
    if (realismCount > 2) return { valid: false, reason: 'Too many Realism tokens (>2)' };

    const hasLens = MANDATORY_LENS_TOKENS.some(t => p.includes(t));
    if (!hasLens) return { valid: false, reason: 'Missing mandatory Lens token' };

    const hasAperture = MANDATORY_APERTURE_TOKENS.some(t => p.includes(t.toLowerCase()));
    if (!hasAperture) return { valid: false, reason: 'Missing mandatory Aperture token' };

    if (p.includes('text saying') || p.includes('written on')) return { valid: false, reason: 'Contains unsafe text instructions' };

    return { valid: true };
}

/**
 * 1. Reference Image Logic (Wikipedia)
 */
async function findReferenceImage(query: string): Promise<{ url: string; license: string; attribution: string } | null> {
    try {
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json() as { query?: { search?: { title: string }[] } };

        if (!searchData.query?.search?.length) return null;

        const title = searchData.query.search[0].title;
        const imgUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages|pageterms&pithumbsize=1000&format=json&origin=*`;
        const imgRes = await fetch(imgUrl);
        const imgData = await imgRes.json() as { query?: { pages?: Record<string, { thumbnail?: { source: string } }> } };

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
 * 2. Imagen 4 Logic
 */
async function generateImagen4(prompt: string): Promise<string> {
    // Retry logic wrapper
    return withRetry(() => vertexClient.generateImage(prompt, "4:3"), {
        retries: 2,
        shouldRetry: (err) => {
            const msg = String(err).toLowerCase();
            return !msg.includes('safety') && !msg.includes('blocked'); // Don't retry safety blocks
        }
    });
}

/**
 * 3. Supabase Storage Upload
 */
async function uploadToStorage(base64OrUrl: string, isUrl: boolean, itemId: number): Promise<string | null> {
    assertMutationAllowed('image:upload');
    try {
        let buffer: Buffer;
        let mimeType = 'image/png';

        if (isUrl) {
            const res = await fetch(base64OrUrl);
            if (!res.ok) throw new Error('Failed to download reference image');

            const arrayBuf = await res.arrayBuffer();
            buffer = Buffer.from(arrayBuf);

            if (buffer.length < 50 * 1024) throw new Error(`Reference image too small`);
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
    if (metrics.get('imagen_generated_count') >= MAX_IMAGES_PER_RUN) {
        console.warn(`[Job] Skipping ${item.id}: MAX_IMAGES_PER_RUN (${MAX_IMAGES_PER_RUN}) reached.`);
        return;
    }

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
            if (!IS_DRY_RUN) {
                const publicUrl = await uploadToStorage(refImage.url, true, item.id);
                if (publicUrl) {
                    await markImageGenerated(supabase, item.id, {
                        image_url: publicUrl,
                        image_source_type: 'reference',
                        image_source_url: refImage.url,
                        image_source_attribution: refImage.attribution
                    });
                    metrics.inc('image_reference_used');
                    return;
                }
            } else {
                console.log('[DRY_RUN] Skipping reference image upload.');
                return;
            }
        }

        // C. Fallback: Imagen 4 + Gemini Flash (PATCH 3)
        console.log(`[Job] Generating Imagen 4 for ${item.id}...`);

        const contextText = fullItem.uk_summary || fullItem.content || '';
        const contextSafe = contextText.substring(0, 3000);
        const location = fullItem.city || fullItem.land || '';

        // 1. Build Prompt
        let richPrompt = await generatePromptWithGemini(contextSafe, fullItem.title, location);

        // 2. Validate
        const val = validatePrompt(richPrompt);
        if (!val.valid) {
            console.warn(`[Prompt] Validation Failed: ${val.reason}. Falling back.`);
            richPrompt = buildFallbackPrompt(fullItem.title, location);
        }

        const finalPrompt = `${richPrompt} Exclude: ${NEGATIVE_PROMPTS}`;

        console.log('--- PROMPT START ---\n' + finalPrompt + '\n--- PROMPT END ---');

        if (IS_DRY_RUN) {
            console.log('[DryRun] Skipping Imagen call.');
            await releaseImageLock(supabase, item.id, 'dry-run');
            return;
        }

        // 4. Generate & Upload
        metrics.inc('imagen_attempts');
        const b64 = await generateImagen4(finalPrompt);

        const publicUrl = await uploadToStorage(b64, false, item.id);
        if (publicUrl) {
            await markImageGenerated(supabase, item.id, {
                image_url: publicUrl,
                image_source_type: 'imagen',
                image_prompt: finalPrompt
            });
            metrics.inc('imagen_generated_count'); // Only count successfully generated AND uploaded
            return;
        }

        throw new Error('Upload failed (no public URL returned)');

    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[Job] Failed item ${item.id}:`, msg);
        metrics.inc('image_failures');

        const isBlockingError = /safety|blocked|policy|content/i.test(msg) || msg.includes('400');
        let attemptsToSet = item.image_generation_attempts + 1;

        if (isBlockingError || attemptsToSet >= MAX_RETRIES) {
            if (isBlockingError) console.warn(`[Job] Blocking error detected for ${item.id}. Disabling further retries.`);
            else console.warn(`[Job] Max retries (${MAX_RETRIES}) reached for ${item.id}. Stop.`);
            attemptsToSet = MAX_GENERATION_ATTEMPTS;
        }

        if (IS_DRY_RUN) {
            console.log('[DRY_RUN] Would mark image failed.');
        } else {
            await markImageFailed(supabase, item.id, msg, attemptsToSet);
        }
    }
}

/**
 * LOOP
 */
async function run() {
    metrics.add('run_started', 1);
    console.log('=== Starting News Image Pipeline ===');
    console.log(`[Job] DryRun = ${IS_DRY_RUN ? 'ON' : 'OFF'}`);

    if (IS_DRY_RUN) {
        console.log('[DRY_RUN] Skipping DB Claim. Exiting.');
        return;
    }

    // Process in batches
    // We claim up to MAX_IMAGES_PER_RUN to ensure we don't over-process in a single run
    // But we also have BATCH_SIZE for memory. 
    // We'll trust limits.MAX_IMAGE_GENS_PER_RUN to serve as the cap.
    const itemsToClaim = Math.min(BATCH_SIZE, MAX_IMAGES_PER_RUN);

    const items = await claimNewsForGeneration(supabase, itemsToClaim);
    console.log(`[Job] Claimed ${items.length} items`);

    if (items.length > SAFETY_ABORT_THRESHOLD) {
        console.error("SAFETY STOP: Too many pending images claimed. Aborting run.");
        process.exit(1);
    }

    // Process sequentially or with small concurrency if needed
    // Current logic is serial in loop
    for (const item of items) {
        if (item.image_generation_attempts >= MAX_RETRIES) {
            console.warn(`[Safety] Skipping item ${item.id} (Attempts MAX)`);
            await markImageFailed(supabase, item.id, "Max retries exceeded", item.image_generation_attempts);
            continue;
        }
        await processItem(item);
    }

    metrics.flushToJson('artifacts/image-run-metrics.json');
    metrics.summaryConsole();
    console.log('=== Batch Complete ===');
}

run().catch(console.error);
