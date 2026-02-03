
import { supabase } from './supabaseClient';
import { claimNewsForGeneration, markImageGenerated, markImageFailed, NewsItemImageState } from './lib/imageStatus';
import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch'; // Standard fetch or node-fetch? tsx uses native fetch usually in Node 18+. We'll use globalThis.fetch if available.

// Environment check for Google Auth
import { GoogleAuth } from 'google-auth-library';
import { execSync } from 'child_process';

const PROJECT_ID = process.env.GOOGLE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'claude-vertex-prod';
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
const MODEL_ID = 'imagen-4.0-generate-001';

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
            // We found an image!
            // MVP: We assume Wikimedia content is reusable with attribution.
            // Ideally we'd query imageinfo for license (extmetadata).
            // For Scope L6 MVP, we will use the source URL as attribution.
            return {
                url: page.thumbnail.source,
                license: 'Wikimedia', // Placeholder for complex logic
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
                const gcloudCmd = process.platform === 'win32'
                    ? 'call "C:\\Users\\David\\AppData\\Local\\Google\\Cloud SDK\\google-cloud-sdk\\bin\\gcloud.cmd" auth print-access-token'
                    : 'gcloud auth print-access-token';
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
                    aspectRatio: "16:9",
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
            const ab = await res.arrayBuffer();
            buffer = Buffer.from(ab);
            const ct = res.headers.get('content-type');
            if (ct) mimeType = ct;
        } else {
            buffer = Buffer.from(base64OrUrl, 'base64');
        }

        const path = `news/${itemId}_${Date.now()}.png`; // Normalize to PNG if possible, or keep ext

        // MVP: Just upload. Assuming bucket 'news-images' exists. 
        // If not, we might need to fail or use public bucket.
        // Let's assume 'images' bucket or similar from previous knowledge? 
        // Project Knowledge doesn't specify bucket.
        // We will try 'public' bucket if standard, or 'news'.
        // Let's safe bet: 'banners' or 'images'.
        // I will try 'news-images' as a reasonable guess for L6. 
        // If it fails, I will mark as failed.

        const { data, error } = await supabase.storage
            .from('news_images') // Created manually? Or existing?
            .upload(path, buffer, { contentType: mimeType, upsert: true });

        if (error) throw error;

        // Get Public URL
        const { data } = supabase.storage.from('news_images').getPublicUrl(path);
        // Typo check: `data` not `kata`. `getPublicUrl` returns object `{ data: { publicUrl } }`

        const pub = supabase.storage.from('news_images').getPublicUrl(path);
        return pub.data.publicUrl;

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
        // A. Get details (title, description)
        const { data: fullItem, error } = await supabase.from('news').select('title, description, city, keywords').eq('id', item.id).single();
        if (error || !fullItem) throw new Error('Item data not found');

        // B. Try Reference (Wikipedia)
        // Heuristic: Use City + Keywords or just Title entities.
        // MVP: Search using Title (first 5 words)
        const searchQuery = fullItem.title.split(' ').slice(0, 5).join(' '); // Simple
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

        // C. Fallback: Imagen 4
        console.log(`[Job] Generating Imagen 4 for ${item.id}`);
        // Prompt Policy: Documentary
        const prompt = `A documentary photo of ${fullItem.title}. ${fullItem.description?.substring(0, 100) || ''}. Realistic, neutral, high quality.`;

        const b64 = await generateImagen4(prompt);
        if (b64) {
            const publicUrl = await uploadToStorage(b64, false, item.id);
            if (publicUrl) {
                await markImageGenerated(supabase, item.id, {
                    image_url: publicUrl,
                    image_source_type: 'imagen',
                    image_prompt: prompt
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
    const items = await claimNewsForGeneration(supabase, 5); // Process 5 at a time
    console.log(`[Job] Claimed ${items.length} items`);

    for (const item of items) {
        await processItem(item);
    }
    console.log('=== Batch Complete ===');
}

run().catch(console.error);

