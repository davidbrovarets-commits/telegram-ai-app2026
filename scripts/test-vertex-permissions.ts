
import { VertexAI } from '@google-cloud/vertexai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testVertex() {
    console.log('🧠 Testing Vertex AI Permissions...');
    const project = process.env.GOOGLE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'claude-vertex-prod';
    const location = 'us-central1';

    console.log(`Target: ${project} / ${location}`);

    try {
        const vertex_ai = new VertexAI({ project: project, location: location });
        const model = vertex_ai.getGenerativeModel({ model: 'gemini-2.5-pro' });

        console.log('📤 Sending request...');
        const resp = await model.generateContent('Reply with exactly "OK"');
        const text = resp.response.candidates[0].content.parts[0].text;

        console.log(`📥 Response: "${text.trim()}"`);

        if (text.trim().includes('OK')) {
            console.log('✅ SUCCESS: Service Account has Vertex AI User permissions.');
        } else {
            console.log('⚠️  Response received but unexpected content.');
        }

    } catch (e: any) {
        console.error('❌ Vertex AI Request Failed:', e.message);
        console.error('   Hint: The Service Account might lack "Vertex AI User" role.');
    }
}

testVertex();
