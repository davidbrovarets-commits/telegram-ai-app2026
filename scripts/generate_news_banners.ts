
import { supabase } from './supabaseClient';
import { claimNewsForGeneration, markImageGenerated, markImageFailed, releaseImageLock, NewsItemImageState } from './lib/imageStatus';
import { VertexAI } from '@google-cloud/vertexai'; // PATCH 3.1: Removed unused imports

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

// --- PATCH 3: CONSTANTS & VALIDATION ---
const MANDATORY_REALISM_TOKENS = [
    'film grain', 'chromatic aberration', 'dust particles', 'subtle motion blur'
];
const MANDATORY_LIGHTING_TOKENS = [
    'cinematic lighting', 'rim light', 'chiaroscuro', 'natural diffused light'
];
// PATCH 3.1: Technical Tokens
const MANDATORY_LENS_TOKENS = ['35mm lens', '50mm lens'];
const MANDATORY_APERTURE_TOKENS = ['f/2.8 aperture', 'f/8 aperture']; // PATCH 3.1.1: Fixed tokens

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
        const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });
        const model = vertexAI.getGenerativeModel({ model: 'gemini-2.0-flash-001' });

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

        const resp = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: systemInstruction + '\n\n' + userPrompt }] }],
            generationConfig: { maxOutputTokens: 300, temperature: 0.7 }
        });

        const text = resp.response.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('Empty response from Gemini Flash');

        return text.trim();

    } catch (e: any) {
        console.warn('Gemini Flash prompt generation failed, falling back to compliant template.', e.message);
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

    const hasAperture = MANDATORY_APERTURE_TOKENS.some(t => p.includes(t)); // PATCH 3.1.1: Removed toLowerCase as tokens are strict
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
 * 2. Imagen 4 Logic
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
        console.log(`[Job] Config: Batch=${BATCH_SIZE}, Attempts=${item.image_generation_attempts}, Ref=${!!refImage ? 'Yes' : 'No'}`);

        // DRY RUN CHECK
        if (IS_DRY_RUN) {
            console.log('[DryRun] Skipping Imagen call.');
            await releaseImageLock(supabase, item.id, 'dry-run');
            return;
        }

        const b64 = await generateImagen4(finalPrompt);
        if (b64) {
            const publicUrl = await uploadToStorage(b64, false, item.id);
            if (publicUrl) {
                await markImageGenerated(supabase, item.id, {
                    image_url: publicUrl,
                    image_source_type: 'imagen',
                    image_prompt: finalPrompt // PATCH 3.1: Store final prompt used for generation
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
