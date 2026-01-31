const { VertexAI } = require('@google-cloud/vertexai');
const admin = require('firebase-admin');
const Parser = require('rss-parser');
const { GoogleAuth } = require('google-auth-library');

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
    const textToRender = "Leipzig";
    return `
Subject: A high-quality, modern header image for a news application.
Context: Abstract background representing digital information and connections, with a focus on the region of ${brief.regionLabel}.
Style: Photorealistic, 4K, HDR, premium UI design, glassmorphism elements, soft studio lighting.
Text: The text "${textToRender}" written in a bold, modern, clean sans-serif font in the center.
Positive Modifiers: detailed, sharp focus, professional, aesthetic, calm, official.
Negative prompt: blurry, distorted text, spelling errors, low quality, pixelated, messy, cluttered, people, faces.
`.trim();
}

async function generateImageNanoBananaPro(prompt) {
    console.log(`Generating image... Prompt len: ${prompt.length}`);

    // Explicitly use process.env provided by Cloud Function config
    const project = process.env.GOOGLE_CLOUD_PROJECT || 'claude-vertex-prod';
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
    const modelId = 'imagen-4.0-generate-001';

    console.log(`Using Project: ${project}, Location: ${location}`);

    try {
        const auth = new GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });
        const client = await auth.getClient();
        const accessToken = (await client.getAccessToken()).token;

        const endpoint = `https://${location}-aiplatform.googleapis.com/v1beta1/projects/${project}/locations/${location}/publishers/google/models/${modelId}:predict`;

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
                    aspectRatio: "16:9", // Changed from 3:1 to 16:9 per user guide
                    outputOptions: { mimeType: "image/png" }
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Vertex AI REST Error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const result = await response.json();
        // Check for predictions
        const base64Image = result.predictions?.[0]?.bytesBase64Encoded;

        if (!base64Image) {
            console.log("No image in response:", JSON.stringify(result));
            return null;
        }

        return Buffer.from(base64Image, 'base64');

    } catch (e) {
        console.log("Image generation failed:", e.message);
        throw e;
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
