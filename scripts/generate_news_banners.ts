import { supabase } from './supabaseClient';
import { claimNewsForGeneration, markImageGenerated, markImageFailed, releaseImageLock, NewsItemImageState, MAX_GENERATION_ATTEMPTS } from './lib/imageStatus';
import { vertexClient } from './utils/vertex-client';
import { assertMutationAllowed, isDryRun } from './lib/mutation-guard';

const BUCKET_NAME = process.env.SUPABASE_NEWS_BUCKET || 'images';

// Configurable Overrides (PATCH 2.1.1: Robust Parsing & Clamping)
const DEFAULT_BATCH_SIZE = 5;
const RAW_BATCH_SIZE_STR = (process.env.NEWS_IMAGES_BATCH_SIZE || '').trim();
const RAW_BATCH_SIZE = Number.parseInt(RAW_BATCH_SIZE_STR || String(DEFAULT_BATCH_SIZE), 10);
const BATCH_SIZE_UNCLAMPED = Number.isFinite(RAW_BATCH_SIZE) ? RAW_BATCH_SIZE : DEFAULT_BATCH_SIZE;
const BATCH_SIZE = Math.min(50, Math.max(1, BATCH_SIZE_UNCLAMPED));

// Robust Dry Run Parsing (PATCH 2.1.1)
// Global DRY_RUN takes precedence, but we also support legacy specific flag
const IS_DRY_RUN = isDryRun();

// --- SAFETY & RELIABILITY (PATCH 4: 2026-02-12) ---
// Allow ops overrides via env, but clamp to safe bounds.
const MAX_IMAGES_PER_RUN = Math.min(50, Math.max(1, Number(process.env.MAX_IMAGES_PER_RUN || 20)));      // HARD CAP
const MAX_CONCURRENCY = Math.min(4, Math.max(1, Number(process.env.MAX_CONCURRENCY || 2)));             // Parallel cap
const MAX_RETRIES = Math.min(3, Math.max(0, Number(process.env.MAX_RETRIES || 2)));                      // Retry storm guard
const SAFETY_ABORT_THRESHOLD = Math.min(100, Math.max(5, Number(process.env.SAFETY_ABORT_THRESHOLD || 30))); // Kill-switch

console.log("SAFETY CONFIG:");
console.log("MAX_IMAGES_PER_RUN:", MAX_IMAGES_PER_RUN);
console.log("MAX_CONCURRENCY:", MAX_CONCURRENCY);
console.log("MAX_RETRIES:", MAX_RETRIES);

// --- PATCH 3: CONSTANTS & VALIDATION ---
const MANDATORY_REALISM_TOKENS = [
    'film grain', 'chromatic aberration', 'dust particles', 'subtle motion blur'
];
const MANDATORY_LIGHTING_TOKENS = [
    'cinematic lighting', 'rim lighting', 'chiaroscuro lighting', 'natural diffused lighting'
];
// PATCH 3.1: Technical Tokens
const MANDATORY_LENS_TOKENS = ['35mm lens', '50mm lens'];
const MANDATORY_APERTURE_TOKENS = ['f/2.8 aperture', 'f/8 aperture']; // keep tokens canonical (lowercase)

const NEGATIVE_PROMPTS = "Blurry. Low quality. Distorted text. Watermark. Oversaturated. Anatomically incorrect. No text. No logos. Not an illustration. No propaganda. No distorted faces. No uncanny people.";

/**
 * Helper: Build Contract-Compliant Fallback Prompt (PATCH 3.1.1)
 * Returns a paragraph of ~100-140 words satisfying all constraints.
 */
function buildFallbackPrompt(title: string, location: string): string {
    const locStr = location ? `The scene is set in ${location}, providing a grounded and authentic atmosphere.` : 'The setting is atmospheric and grounded.';

    return `A realistic documentary photograph capturing the essence of "${title}". ${locStr} The image focuses on symbolic elements representing the core news story, avoiding specific real-world individuals in favor of representative figures or objects. The composition is balanced and professional, typical of high-end photojournalism. Lighting plays a key role, with cinematic lighting casting dramatic shadows and highlighting the central subject matter. The aesthetic is strictly documentary, with no artificial or illustrative elements. Shot with a 35mm lens, the field of view feels natural and immersive. An f/8 aperture ensures a sharp depth of field, keeping the context visible. Subtle film grain adds a layer of texture and realism to the final image. This photograph aims to convey the gravity and significance of the event through visual storytelling, maintaining a neutral and objective observer perspectives.`;
}

/**
 * 0. Gemini Flash Prompt Builder (PATCH 3: Golden Formula)
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

        // Use VertexClient for text generation (will use default model or env var)
        const text = await vertexClient.generateText(systemInstruction + '\n\n' + userPrompt, 0.7);
        return text.trim();

    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn('Gemini Flash prompt generation failed, falling back to compliant template.', msg);
        // Fallback to compliant contract (PATCH 3.1.1)
        return buildFallbackPrompt(title, location);
    }
}

/**
 * Validation Helper (PATCH 3.1: Strict Hardening)
 */
function validatePrompt(prompt: string): { valid: boolean; reason?: string } {
    const p = prompt.toLowerCase();

    // 1. Length Check (Strict 100-200)
    const wordCount = prompt.split(/\s+/).length;
    if (wordCount < 100) return { valid: false, reason: `Too short (${wordCount} < 100 words)` };
    if (wordCount > 200) return { valid: false, reason: `Too long (${wordCount} > 200 words)` };

    // 2. Lighting Check
    const hasLighting = MANDATORY_LIGHTING_TOKENS.some(t => p.includes(t));
    if (!hasLighting) return { valid: false, reason: 'Missing mandatory Lighting token' };

    // 3. Realism Check (Strict 1-2)
    const realismCount = MANDATORY_REALISM_TOKENS.filter(t => p.includes(t)).length;
    if (realismCount < 1) return { valid: false, reason: 'Missing mandatory Realism token' };
    if (realismCount > 2) return { valid: false, reason: 'Too many Realism tokens (>2)' };

    // 4. Technical Check (Lens/Aperture)
    const hasLens = MANDATORY_LENS_TOKENS.some(t => p.includes(t));
    if (!hasLens) return { valid: false, reason: 'Missing mandatory Lens token' };

    const hasAperture = MANDATORY_APERTURE_TOKENS.some(t => p.includes(t.toLowerCase()));
    if (!hasAperture) return { valid: false, reason: 'Missing mandatory Aperture token' };

    // 5. Text Safety
    if (p.includes('text saying') || p.includes('written on')) return { valid: false, reason: 'Contains unsafe text instructions' };

    return { valid: true };
}


/**
 * 1. Reference Image Logic (Wikipedia)
 */
async function findReferenceImage(query: string): Promise<{ url: string; license: string; attribution: string } | null> {
    try {
        // Search Wikipedia API for page
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json() as { query?: { search?: { title: string }[] } };

        if (!searchData.query?.search?.length) return null;

        const title = searchData.query.search[0].title;

        // Get Page Images
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
    // Use VertexClient for image generation (handles auth, retry, 429)
    return vertexClient.generateImage(prompt, "4:3"); // aspectRatio: "4:3" (Monitor Check)
}

/**
 * 3. Supabase Storage Upload
 */
async function uploadToStorage(base64OrUrl: string, isUrl: boolean, itemId: number): Promise<string | null> {
    assertMutationAllowed('image:upload'); // HARD GUARD
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
            if (!IS_DRY_RUN) {
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
            } else {
                console.log('[DRY_RUN] Skipping reference image upload.');
                return;
            }
        }

        // C. Fallback: Imagen 4 + Gemini Flash (PATCH 3)
        console.log(`[Job] Generating Imagen 4 for ${item.id} (Prompting via Gemini)...`);

        // Context Selection: uk_summary > content
        const contextText = fullItem.uk_summary || fullItem.content || '';
        const contextSafe = contextText.substring(0, 3000);
        const location = fullItem.city || fullItem.land || '';

        // 1. Build Prompt
        let richPrompt = await generatePromptWithGemini(contextSafe, fullItem.title, location);

        // 2. Validate
        const val = validatePrompt(richPrompt);
        if (!val.valid) {
            console.warn(`[Prompt] Validation Failed: ${val.reason}. Falling back.`);
            richPrompt = buildFallbackPrompt(fullItem.title, location); // Patch 3.1.1: Compliant fallback
        }

        // 3. Add Negatives
        const finalPrompt = `${richPrompt} Exclude: ${NEGATIVE_PROMPTS}`;

        // OBSERVABILITY LOGGING
        console.log('--- PROMPT START ---');
        console.log(finalPrompt);
        console.log('--- PROMPT END ---');
        console.log(`[Job] Config: Batch=${BATCH_SIZE}, Attempts=${item.image_generation_attempts}, Ref=${refImage ? 'Yes' : 'No'}`);

        // DRY RUN CHECK
        if (IS_DRY_RUN) {
            console.log('[DryRun] Skipping Imagen call.');
            await releaseImageLock(supabase, item.id, 'dry-run');
            return;
        }

        // 4. Generate & Upload
        const b64 = await generateImagen4(finalPrompt);
        // generateImagen4 now throws on error, so we don't need to check for null

        const publicUrl = await uploadToStorage(b64, false, item.id);
        if (publicUrl) {
            await markImageGenerated(supabase, item.id, {
                image_url: publicUrl,
                image_source_type: 'imagen',
                image_prompt: finalPrompt
            });
            return;
        }

        throw new Error('Upload failed (no public URL returned)');

    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[Job] Failed item ${item.id}:`, msg);

        // Patch 5: Smart Retry Logic + Patch 4 Safety
        const isBlockingError = /safety|blocked|policy|content/i.test(msg) || msg.includes('400');

        let attemptsToSet = item.image_generation_attempts + 1; // Increment attempt count

        if (isBlockingError || attemptsToSet >= MAX_RETRIES) {
            if (isBlockingError) console.warn(`[Job] Blocking error detected for ${item.id}. Disabling further retries.`);
            else console.warn(`[Job] Max retries (${MAX_RETRIES}) reached for ${item.id}. Stop.`);

            attemptsToSet = MAX_GENERATION_ATTEMPTS; // Max out attempts to stop retry logic in DB
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
    console.log('=== Starting News Image Pipeline ===');
    console.log(`[Job] DryRun = ${IS_DRY_RUN ? 'ON' : 'OFF'} (raw="${process.env.NEWS_IMAGES_DRY_RUN_PROMPT || ''}")`);
    console.log(`[Job] Batch size = ${Math.min(BATCH_SIZE, MAX_IMAGES_PER_RUN)} (Effective Safety Cap)`);

    // Safety: Claim only up to MAX_IMAGES_PER_RUN
    // GUARD CLAIM? claiming updates DB (status=PROCESSING).
    // If we are in dry run, we probably shouldn't even claim, or we should claim with a dry-run flag?
    // But claimNewsForGeneration is imported.
    // If we run dry-run on local data, we need data.
    // Let's assume claim is allowed OR we should skip it.
    // If we skipp it we process nothing.
    // For local dev dry run, we might want to process "would generate".
    // But claim locks the item.

    // DECISION: In Strict Dry Run, we DO NOT CLAIM. We just look at items?
    // But then we can't test the generation loop on specific items.
    // Let's assume we can claim if DRY_RUN is false. 
    // BUT local-dev-run says "Simulate".

    if (IS_DRY_RUN) {
        console.log('[DRY_RUN] Skipping DB Claim. Fetching read-only if possible or stopping.');
        // We can't really simulate easily without potentially locking items. 
        // For now, let's just stop or fetch without locking.
        console.log('To test generation locally, use DRY_RUN=false with caution or implement read-only fetch.');
        return;
    }

    const items = await claimNewsForGeneration(supabase, Math.min(BATCH_SIZE, MAX_IMAGES_PER_RUN));
    console.log(`[Job] Claimed ${items.length} items`);

    if (items.length > SAFETY_ABORT_THRESHOLD) {
        console.error("SAFETY STOP: Too many pending images claimed. Aborting run.");
        process.exit(1);
    }

    for (const item of items) {
        if (item.image_generation_attempts >= MAX_RETRIES) {
            console.warn(`[Safety] Skipping item ${item.id} (Attempts ${item.image_generation_attempts} >= ${MAX_RETRIES})`);
            await markImageFailed(supabase, item.id, "Max retries exceeded (Safety Guard)", item.image_generation_attempts);
            continue;
        }

        await processItem(item);
    }
    console.log('=== Batch Complete ===');
}

run().catch(console.error);
