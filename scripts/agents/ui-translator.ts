
import fs from 'fs';
import path from 'path';
import { generateEmbedding } from './vectorizer'; // Check if we can reuse auth from here?
// Actually vectorizer export generateEmbedding, but we need text generation (Chat).
// Let's import from summarizer logic? Or just direct Vertex call.
// I'll create a clean helper `scripts/lib/vertex.ts` eventually, but for now duplicate auth logic or reuse `summarizer.ts`?
// `summarizer.ts` exports `summarizeAndTranslate`. It's specific.
// I will copy the Vertex Client logic here for autonomy.

import { execSync } from 'child_process';
import dotenv from 'dotenv';
dotenv.config();

const PROJECT = process.env.GOOGLE_PROJECT_ID || 'claude-vertex-prod';
const LOCATION = 'us-central1';
const MODEL = 'gemini-2.5-pro'; // Use the fast/good model

async function getAccessToken(): Promise<string | undefined> {
    try {
        const { GoogleAuth } = await import('google-auth-library');
        const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
        const client = await auth.getClient();
        const { token } = await client.getAccessToken();
        if (token) return token;
    } catch (e) { }
    try {
        const token = execSync('gcloud auth print-access-token', { encoding: 'utf-8' }).trim();
        if (token) return token;
    } catch (e) { }
    return process.env.GOOGLE_ACCESS_TOKEN;
}

const LOCALES_DIR = path.join(process.cwd(), 'src/locales');
const SOURCE_LANG = 'en';
const TARGET_LANGS = ['de', 'uk', 'ru'];

// Recursive flattening of keys for easier processing? 
// Or just keep JSON structure and let AI handle it.
// AI handles JSON well.

async function translateChunk(jsonObj: any, targetLang: string): Promise<any> {
    const accessToken = await getAccessToken();
    if (!accessToken) throw new Error("No Access Token");

    const prompt = `You are a professional App Translator.
Translate the following JSON content from English to ${targetLang}.
Preserve the keys and structure EXACTLY. Only translate values.
Do not translate technical keys like IDs if they appear (but here strictly UI strings).
Output purely valid JSON.

JSON:
${JSON.stringify(jsonObj, null, 2)}
`;

    const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${LOCATION}/publishers/google/models/${MODEL}:generateContent`;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
        })
    });

    const data: any = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) throw new Error("AI returned no text");
    return JSON.parse(text);
}

// Deep merge helper
function mergeDeep(target: any, source: any) {
    for (const key of Object.keys(source)) {
        if (source[key] instanceof Object && key in target) {
            Object.assign(source[key], mergeDeep(target[key], source[key]));
        }
    }
    Object.assign(target || {}, source);
    return target;
}

// Find missing keys
function getMissingKeys(source: any, target: any): any {
    const missing: any = {};
    let hasMissing = false;

    for (const key in source) {
        if (typeof source[key] === 'object' && source[key] !== null) {
            const nested = getMissingKeys(source[key], target?.[key] || {});
            if (Object.keys(nested).length > 0) {
                missing[key] = nested;
                hasMissing = true;
            }
        } else {
            if (!target || target[key] === undefined || target[key] === "") {
                missing[key] = source[key];
                hasMissing = true;
            }
        }
    }
    return hasMissing ? missing : {};
}

async function run() {
    console.log('🌍 Starting UI Auto-Translator...');

    const sourcePath = path.join(LOCALES_DIR, SOURCE_LANG, 'translation.json');
    if (!fs.existsSync(sourcePath)) {
        console.error('Source file not found!');
        return;
    }

    const sourceContent = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'));

    for (const lang of TARGET_LANGS) {
        console.log(`\nProcessing [${lang}]...`);
        const targetPath = path.join(LOCALES_DIR, lang, 'translation.json');

        let targetContent = {};
        if (fs.existsSync(targetPath)) {
            try {
                targetContent = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
            } catch { targetContent = {}; }
        }

        const missing = getMissingKeys(sourceContent, targetContent);

        if (Object.keys(missing).length === 0) {
            console.log(`   ✅ Everything up to date.`);
            continue;
        }

        console.log(`   🔍 Found missing keys:`, JSON.stringify(missing).substring(0, 100) + '...');
        console.log(`   🤖 Translating...`);

        try {
            const translatedChunk = await translateChunk(missing, lang);

            // Merge back
            // We need to merge `translatedChunk` into `targetContent` carefully?
            // Actually `missing` has the structure. `translatedChunk` should have same structure.
            // We can just deep merge `translatedChunk` into `targetContent`.

            // Simple approach: Reload target, assign values.
            // But deep merge is safer. I'll rely on my logical structure.

            // Helper to fill target with translated
            const fill = (targ: any, trans: any) => {
                for (const k in trans) {
                    if (typeof trans[k] === 'object') {
                        if (!targ[k]) targ[k] = {};
                        fill(targ[k], trans[k]);
                    } else {
                        targ[k] = trans[k];
                    }
                }
            };

            fill(targetContent, translatedChunk);

            fs.writeFileSync(targetPath, JSON.stringify(targetContent, null, 2), 'utf-8');
            console.log(`   💾 Saved ${lang}/translation.json`);

        } catch (e) {
            console.error(`   ❌ Translation failed for ${lang}:`, e);
        }
    }
}

run();
