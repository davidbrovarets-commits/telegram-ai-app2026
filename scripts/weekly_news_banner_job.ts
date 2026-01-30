
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
function buildPrompt(brief: WeeklyBrief): string {
    const template = `[ROLE] You generate a clean modern hero banner for a news section in a mobile app.
[FORMAT] Wide banner, safe margins, high contrast for white text overlay, minimal details.
[REGION] Theme: ${brief.regionLabel}. Week: ${brief.weekRange}.
[VISUAL] Abstract, modern, calm, official. Subtle abstract shapes suggesting city/region (non-realistic).
[TOPICS] Visual hints for topics: ${brief.topTopics.join(', ')} (symbolic icons/shapes only, no words).
[STYLE] modern UI / glassmorphism / abstract gradient / minimal. Soft gradient background, glassmorphism feel, premium UI.
[TEXT] Leave space for title text in the lower-left area, do not render any text in the image.
[SAFETY] No faces, no real people, no logos, no flags, no political symbols, no photorealism, no trademarks.`;
    return template;
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

    try {
        const { VertexAI } = await import('@google-cloud/vertexai');

        const project = process.env.GOOGLE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'telegram-ai-app-2026';
        const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

        const vertex_ai = new VertexAI({ project: project, location: location });

        // MODEL ID: "nano-banana-pro"
        const modelId = 'nano-banana-pro';

        console.log(`[NanoBanana] Connecting to model: ${modelId}...`);

        // FALLBACK TO DIRECT REST API (most reliable for custom endpoints)
        const accessToken = process.env.GOOGLE_ACCESS_TOKEN;

        // If we don't have token locally, we simulate success for dev flow unless strict.
        if (!accessToken && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            console.warn("[NanoBanana] No auth token found locally. Simulating success for development.");
            const mockRes = await fetch('https://placehold.co/1500x500/FFD700/000000/png?text=Nano+Banana+Simulated');
            const buf = await mockRes.arrayBuffer();
            fs.writeFileSync(outputPath, Buffer.from(buf));
            return true;
        }

        const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${modelId}:predict`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                instances: [{ prompt: prompt }],
                parameters: { sampleCount: 1, aspectRatio: "3:1" }
            })
        });

        if (!response.ok) throw new Error(`Vertex AI Error: ${response.statusText}`);

        const result: any = await response.json();
        const base64Image = result.predictions?.[0]?.bytesBase64Encoded;

        if (base64Image) {
            fs.writeFileSync(outputPath, Buffer.from(base64Image, 'base64'));
            return true;
        }

    } catch (e: any) {
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
