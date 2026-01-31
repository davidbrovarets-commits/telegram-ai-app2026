
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { VertexAI } from '@google-cloud/vertexai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

async function runArchitectReview() {
    console.log('[Architect] Starting Daily Review...');

    // 1. Read Knowledge Base
    const knowledgePath = path.join(ROOT_DIR, 'brain', '131f6a58-7079-474a-828f-6c1614bc6882', 'project_knowledge.md'); // Adjust path in real usage or use generic
    // Fallback if specific brain path isn't static in CI
    // actually in CI we might not have access to 'brain' unless committed. 
    // Let's assume we read the 'docs' or specific config files.
    // For now, let's critique package.json and the Orchestrator.

    const orchestratorPath = path.join(ROOT_DIR, 'scripts', 'orchestrator-l6.ts');
    const orchestratorCode = fs.readFileSync(orchestratorPath, 'utf-8');

    // 2. Initialize AI
    const project = process.env.GOOGLE_PROJECT_ID;
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

    if (!project) throw new Error("GOOGLE_PROJECT_ID missing");

    const vertexAI = new VertexAI({ project: project, location: location });
    const model = vertexAI.preview.getGenerativeModel({
        model: 'gemini-2.5-pro',
        generationConfig: {
            maxOutputTokens: 8192,
            temperature: 0.7, // Higher temp for creative critique
        },
        systemInstruction: {
            role: 'system',
            parts: [{
                text: `
You are the Lead Architect of this project. 
Your job is to read the provided code and CRITICIZE it constructively.
Goal: Find "Good" solutions that can be "Great".
Constraints:
1. HARMONY: Proposals must fit existing patterns (TypeScript, L6, Supabase).
2. NON-BREAKING: Improvements must be additive or refactors, not rewrites.
3. SYNERGY: Improving one part should help others.

Output Format: Markdown.
` }]
        }
    });

    // 3. Generate Critique
    console.log('[Architect] Analyzing Orchestrator L6...');
    const result = await model.generateContent({
        contents: [{
            role: 'user', parts: [{
                text: `
Here is the current Orchestrator Logic:
\`\`\`typescript
${orchestratorCode.substring(0, 10000)} // Truncate for safety
\`\`\`

Analyze this. Suggest 1 concrete architectural improvement that makes it more robust, self-healing, or efficient.
` }]
        }]
    });

    const suggestion = result.response.candidates?.[0].content.parts[0].text;

    if (suggestion) {
        console.log('[Architect] Suggestion generated.');
        const outPath = path.join(ROOT_DIR, 'docs', 'architectural_suggestions.md');
        const entry = `\n\n## Critique ${new Date().toISOString()}\n${suggestion}`;
        fs.appendFileSync(outPath, entry);
        console.log(`[Architect] Saved to ${outPath}`);
    } else {
        console.log('[Architect] No suggestion generated.');
    }
}

runArchitectReview().catch(console.error);
