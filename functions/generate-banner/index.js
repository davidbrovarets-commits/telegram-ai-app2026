const { VertexAI } = require('@google-cloud/vertexai');
const admin = require('firebase-admin');
const Parser = require('rss-parser');

admin.initializeApp();

const SOURCES = [
    {
        "name": "Tagesschau",
        "type": "rss",
        "url": "https://www.tagesschau.de/xml/rss2",
        "weight": 0.2
    },
    {
        "name": "MDR Sachsen",
        "type": "rss",
        "url": "https://www.mdr.de/nachrichten/sachsen/rss.xml",
        "weight": 0.3
    },
    {
        "name": "Stadt Leipzig Pressemitteilungen",
        "type": "rss",
        "url": "https://www.leipzig.de/news/rss.xml",
        "weight": 0.5
    }
];

// Helpers
function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return [d.getUTCFullYear(), weekNo];
}

function getFormattedWeekRange(d) {
    const startOfWeek = new Date(d);
    const day = startOfWeek.getDay() || 7;
    if (day !== 1) startOfWeek.setHours(-24 * (day - 1));

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    const opts = { month: 'short', day: 'numeric' };
    return `${startOfWeek.toLocaleDateString('en-US', opts)} - ${endOfWeek.toLocaleDateString('en-US', opts)}, ${startOfWeek.getFullYear()}`;
}

async function fetchSources(sources) {
    const parser = new Parser();
    let allTitles = [];

    console.log(`Fetching ${sources.length} sources...`);

    for (const source of sources) {
        try {
            const feed = await parser.parseURL(source.url);
            // Take top 5
            const items = feed.items.slice(0, 5);
            items.forEach(item => {
                if (item.title) {
                    allTitles.push({ title: item.title, weight: source.weight });
                }
            });
        } catch (error) {
            console.error(`Error fetching ${source.name}: ${error.message}`);
        }
    }

    const sorted = allTitles.sort(() => 0.5 - Math.random()).slice(0, 5);
    return sorted.map(t => t.title);
}

function buildPrompt(brief) {
    return `[ROLE] You generate a clean modern hero banner for a news section in a mobile app.
[FORMAT] Wide banner, safe margins, high contrast for white text overlay, minimal details.
[REGION] Theme: ${brief.regionLabel}. Week: ${brief.weekRange}.
[VISUAL] Abstract, modern, calm, official. Subtle abstract shapes suggesting city/region (non-realistic).
[TOPICS] Visual hints for topics: ${brief.topTopics.join(', ')} (symbolic icons/shapes only, no words).
[STYLE] modern UI / glassmorphism / abstract gradient / minimal. Soft gradient background, glassmorphism feel, premium UI.
[TEXT] Leave space for title text in the lower-left area, do not render any text in the image.
[SAFETY] No faces, no real people, no logos, no flags, no political symbols, no photorealism, no trademarks.`;
}

async function generateImageNanoBananaPro(prompt) {
    console.log(`Generating image... Prompt len: ${prompt.length}`);
    try {
        const project = process.env.GOOGLE_CLOUD_PROJECT;
        const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

        const vertex_ai = new VertexAI({ project: project, location: location });

        // Using standard Imagen model ID as proxy for "Nano Banana" in this context
        // or the specific fine-tuned ID if we had it.
        const modelId = 'imagegeneration@006';

        const generativeModel = vertex_ai.preview.getGenerativeModel({
            model: modelId,
            generationConfig: { numberOfImages: 1, aspectRatio: '3:1' }
        });

        // SDK generate images
        const resp = await generativeModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });

        // This is simplified. Real SDK return shape might vary for Images.
        // Assuming base64 in response.
        // If SDK doesn't support images well yet, we'd use REST here.
        // For simplicity in this function, allowing the standard generation path.

        // Fallback to fetch if SDK seems text-only
        if (!resp || !resp.response) throw new Error("No response from Vertex AI");

        // For now, let's assume we get base64 from a helper or this call
        // If this part is tricky, we might need the REST implementation again.
        // I will copy the robust REST implementation from the previous script to ensure it works.
        throw new Error("SDK Direct Image Generation not fully guaranteed here, switching to REST block below if needed.");

    } catch (e) {
        console.log("SDK approach skipped/failed, trying robust REST...", e.message);
        // Robust REST fallback (Nano Banana Pro)
        const project = process.env.GOOGLE_CLOUD_PROJECT;
        const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
        const modelId = 'imagegeneration@006';

        const auth = new admin.google.auth.GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });
        const client = await auth.getClient();
        const accessToken = (await client.getAccessToken()).token;

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
        const result = await response.json();
        const base64Image = result.predictions?.[0]?.bytesBase64Encoded;
        return base64Image ? Buffer.from(base64Image, 'base64') : null;
    }
}

exports.generateBanner = async (req, res) => {
    console.log("Cloud Function Triggered");

    try {
        const today = new Date();
        const topics = await fetchSources(SOURCES);

        const brief = {
            weekRange: getFormattedWeekRange(today),
            topTopics: topics,
            regionLabel: "Sachsen / Leipzig"
        };

        const prompt = buildPrompt(brief);
        const imageBuffer = await generateImageNanoBananaPro(prompt);

        if (!imageBuffer) {
            console.error("Failed to generate image");
            return res.status(500).send("Generation failed");
        }

        // Upload to Firebase Storage
        const bucket = admin.storage().bucket();
        const file = bucket.file('banners/sachsen-leipzig/latest.png');

        await file.save(imageBuffer, {
            contentType: 'image/png',
            metadata: {
                metadata: {
                    prompt: prompt,
                    topics: JSON.stringify(topics),
                    generatedAt: new Date().toISOString()
                }
            }
        });

        // Make public? Or rely on client SDK download URL (signed).
        // If we want public access:
        await file.makePublic();

        console.log("Banner uploaded successfully");
        res.status(200).send("New banner generated and uploaded.");

    } catch (error) {
        console.error("Error in generateBanner:", error);
        res.status(500).send(error.message);
    }
};
