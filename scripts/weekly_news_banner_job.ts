
import fs from 'fs';
import path from 'path';
import Parser from 'rss-parser'; // using rss-parser
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load env vars
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Config
const SOURCES_PATH = path.join(ROOT_DIR, 'config', 'sources.json');
const ASSETS_DIR = path.join(ROOT_DIR, 'public', 'assets', 'news', 'hero');

// Types
interface Source {
    name: string;
    type: string;
    url: string;
    layer: 'national' | 'bundesland' | 'city';
    weight: number;
    keywords: string[];
}

interface WeeklyBrief {
    weekRange: string;
    topTopics: string[];
    regionLabel: string;
}

// 1. Helpers
function getWeekNumber(d: Date): [number, number] {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return [d.getUTCFullYear(), weekNo];
}

function getFormattedWeekRange(d: Date): string {
    // Return e.g. "Jan 29 - Feb 04, 2026"
    const startOfWeek = new Date(d);
    const day = startOfWeek.getDay() || 7;
    if (day !== 1) startOfWeek.setHours(-24 * (day - 1));

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${startOfWeek.toLocaleDateString('en-US', opts)} - ${endOfWeek.toLocaleDateString('en-US', opts)}, ${startOfWeek.getFullYear()}`;
}

// 2. Fetch & Aggregate
async function fetchSources(sources: Source[]): Promise<string[]> {
    const parser = new Parser();
    let allTitles: { title: string, weight: number }[] = [];

    console.log(`[Job] Fetching ${sources.length} sources...`);

    for (const source of sources) {
        try {
            const feed = await parser.parseURL(source.url);
            console.log(`  - Fetched ${source.name}: ${feed.items.length} items`);

            // Take top 5 items
            const items = feed.items.slice(0, 5);
            items.forEach((item: any) => {
                if (item.title) {
                    allTitles.push({
                        title: item.title,
                        weight: source.weight
                    });
                }
            });
        } catch (error) {
            console.error(`  ! Error fetching ${source.name}: ${(error as Error).message}`);
        }
    }

    // specific mixing logic: 50% City, 30% Land, 20% National?
    // For MVP, we just take weighted random or simple top weighted.
    // Let's simplified: sort by weight desc? No, weight is per source. 
    // We'll just grab top 5 titles based on weight * random factor for variety.

    const sorted = allTitles.sort(() => 0.5 - Math.random()).slice(0, 5);
    return sorted.map(t => t.title);
}

// 3. Brief & Prompt Builder
// 3. Brief & Prompt Builder
function buildPrompt(brief: WeeklyBrief): string {
    // User Guide Implementation:
    // Subject + Context + Style + Text + Modifiers
    // "Keep it short: Limit text to 25 characters or less."

    const textToRender = "Leipzig"; // Keeping it simple and reliable

    return `
Subject: A high-quality, modern header image for a news application.
Context: Abstract background representing digital information and connections, with a focus on the region of ${brief.regionLabel}.
Style: Photorealistic, 4K, HDR, premium UI design, glassmorphism elements, soft studio lighting.
Text: The text "${textToRender}" written in a bold, modern, clean sans-serif font in the center.
Positive Modifiers: detailed, sharp focus, professional, aesthetic, calm, official.
Negative prompt: blurry, distorted text, spelling errors, low quality, pixelated, messy, cluttered, people, faces.
`.trim();
}

// 4. Image Generator (Nano Banana Pro via Vertex AI)
async function generateImageNanoBananaPro(prompt: string, outputPath: string): Promise<boolean> {
    console.log(`[NanoBanana] Generating image with prompt:\n${prompt}`);

    // MOCK MODE (if env var set)
    if (process.env.MOCK_GENERATION === 'true') {
        console.log('[NanoBanana] Mock mode enabled. Downloading placeholder...');
        const response = await fetch('https://placehold.co/1500x500/FFD700/000000/png?text=Nano+Banana+Pro');
        const buffer = await response.arrayBuffer();
        fs.writeFileSync(outputPath, Buffer.from(buffer));
        return true;
    }

    fs.appendFileSync('debug_job.txt', `[${new Date().toISOString()}] Starting generation...\n`);

    try {
        const { VertexAI } = await import('@google-cloud/vertexai');

        const project = process.env.GOOGLE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'claude-vertex-prod';
        const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

        // MODEL ID: Imagen 4 (GA)
        const modelId = 'imagen-4.0-generate-001';

        fs.appendFileSync('debug_job.txt', `[${new Date().toISOString()}] Project: ${project}, Location: ${location}\n`);

        // PRIORITY 1: Token from env
        let accessToken = process.env.GOOGLE_ACCESS_TOKEN;

        // PRIORITY 2: Fetch from gcloud CLI directly (Best for local dev with 'gcloud auth login')
        if (!accessToken) {
            fs.appendFileSync('debug_job.txt', `[${new Date().toISOString()}] No env token, trying gcloud CLI...\n`);
            try {
                const { execSync } = await import('child_process');
                console.log("[NanoBanana] Attempting to fetch token via gcloud CLI...");
                // Adjust path for Windows if needed, but 'gcloud' is usually in PATH
                // Or use the known path: "C:\Users\David\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
                const gcloudCmd = process.platform === 'win32'
                    ? 'call "C:\\Users\\David\\AppData\\Local\\Google\\Cloud SDK\\google-cloud-sdk\\bin\\gcloud.cmd" auth print-access-token'
                    : 'gcloud auth print-access-token';

                accessToken = execSync(gcloudCmd).toString().trim();
                console.log("[NanoBanana] Token fetched via gcloud CLI.");
                fs.appendFileSync('debug_job.txt', `[${new Date().toISOString()}] Token fetched via CLI (len: ${accessToken.length})\n`);
            } catch (err) {
                console.warn("[NanoBanana] Failed to fetch token via gcloud CLI:", (err as Error).message);
                fs.appendFileSync('debug_job.txt', `[${new Date().toISOString()}] CLI fetch failed: ${(err as Error).message}\n`);
            }
        }

        if (!accessToken) {
            fs.appendFileSync('debug_job.txt', `[${new Date().toISOString()}] No token found after CLI. Trying GoogleAuth...\n`);
            // PRIORITY 3: GoogleAuth (Service Account / ADC)
            try {
                const { GoogleAuth } = await import('google-auth-library');
                const auth = new GoogleAuth({
                    scopes: ['https://www.googleapis.com/auth/cloud-platform']
                });
                const client = await auth.getClient();
                accessToken = (await client.getAccessToken()).token || undefined;
                fs.appendFileSync('debug_job.txt', `[${new Date().toISOString()}] Token fetched via GoogleAuth (len: ${accessToken?.length})\n`);
            } catch (e) {
                console.warn("GoogleAuth failed:", e);
                fs.appendFileSync('debug_job.txt', `[${new Date().toISOString()}] GoogleAuth failed: ${e}\n`);
            }
        }

        if (!accessToken) fs.appendFileSync('debug_job.txt', `[${new Date().toISOString()}] FATAL: No access token.\n`);

        /*
        // If we don't have token locally, we simulate success for dev flow unless strict.
        if (!accessToken && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            console.warn("[NanoBanana] No auth token found locally. Simulating success for development.");
            const mockRes = await fetch('https://placehold.co/1500x500/FFD700/000000/png?text=Nano+Banana+Simulated');
            const buf = await mockRes.arrayBuffer();
            fs.writeFileSync(outputPath, Buffer.from(buf));
            return true;
        }
        */

        const endpoint = `https://${location}-aiplatform.googleapis.com/v1beta1/projects/${project}/locations/${location}/publishers/google/models/${modelId}:predict`;
        fs.appendFileSync('debug_job.txt', `[${new Date().toISOString()}] Endpoint: ${endpoint}\n`);

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
            const errText = await response.text();
            fs.appendFileSync('debug_job.txt', `[${new Date().toISOString()}] ERROR: ${response.status} - ${errText}\n`);
            console.error(`[NanoBanana] Vertex AI Error Details: ${errText}`);
            fs.writeFileSync('error_log.txt', `Status: ${response.status}\nBody: ${errText}`);
            throw new Error(`Vertex AI Error: ${response.status} ${response.statusText}`);
        }

        const result: any = await response.json();
        const base64Image = result.predictions?.[0]?.bytesBase64Encoded;

        fs.appendFileSync('debug_job.txt', `[${new Date().toISOString()}] Success! Image received (len: ${base64Image?.length})\n`);

        if (base64Image) {
            fs.writeFileSync(outputPath, Buffer.from(base64Image, 'base64'));
            return true;
        }

    } catch (e: any) {
        fs.appendFileSync('debug_job.txt', `[${new Date().toISOString()}] EXCEPTION: ${e.message}\n`);
        console.error('[NanoBanana] Generation failed:', e.message);
    }
    return false;
}

// MAIN JOB
async function run() {
    console.log('=== STARTING WEEKLY BANNER JOB ===');

    // 0. Setup
    const SOURCES = JSON.parse(fs.readFileSync(SOURCES_PATH, 'utf-8'));
    const REGION_KEY = 'sachsen-leipzig'; // MVP target
    const TARGET_DIR = path.join(ASSETS_DIR, REGION_KEY);

    if (!fs.existsSync(TARGET_DIR)) {
        fs.mkdirSync(TARGET_DIR, { recursive: true });
    }

    const today = new Date();
    const [year, week] = getWeekNumber(today);
    const filename = `${year}-${week.toString().padStart(2, '0')}.png`;
    const filePath = path.join(TARGET_DIR, filename);

    // 1. Fetch
    const topics = await fetchSources(SOURCES);
    console.log('[Job] Extracted topics:', topics);

    // 2. Brief
    const brief: WeeklyBrief = {
        weekRange: getFormattedWeekRange(today),
        topTopics: topics,
        regionLabel: "Sachsen / Leipzig"
    };

    // 3. Prompt
    const prompt = buildPrompt(brief);
    /* const params = {
        size: "1500x500",
        seed: year + week // stable seed
    }; */

    // 4. Generate
    const success = await generateImageNanoBananaPro(prompt, filePath);

    if (success) {
        console.log(`[Job] Saved to ${filePath}`);

        // 5. Update latest
        const latestPath = path.join(TARGET_DIR, 'latest.png');
        if (fs.existsSync(latestPath)) fs.unlinkSync(latestPath);
        fs.copyFileSync(filePath, latestPath);

        const metadata = {
            updatedAt: new Date().toISOString(),
            week: `${year}-${week}`,
            topics: brief.topTopics,
            prompt: prompt
        };
        fs.writeFileSync(path.join(TARGET_DIR, 'latest.json'), JSON.stringify(metadata, null, 2));

        console.log('[Job] Updated latest.png and latest.json');
    } else {
        console.error('[Job] Failed to generate image.');
        process.exit(1);
    }

    console.log('=== JOB FINISHED ===');
}

run().catch(console.error);
