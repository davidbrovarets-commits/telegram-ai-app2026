
import { execSync } from 'child_process';
import dotenv from 'dotenv';
dotenv.config();

const PROJECT = process.env.GOOGLE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'claude-vertex-prod';
const LOCATION = 'us-central1';
const MODEL = 'text-embedding-004';

// Use same Access Token logic as summarizer
async function getAccessToken(): Promise<string | undefined> {
    if (process.env.GOOGLE_ACCESS_TOKEN) return process.env.GOOGLE_ACCESS_TOKEN;
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.GOOGLE_ACCESS_TOKEN) {
        // Should work automatically via GoogleAuth library if installed
        // But here we implement manual check just in case
    }

    try {
        const { GoogleAuth } = await import('google-auth-library');
        const auth = new GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });
        const client = await auth.getClient();
        const { token } = await client.getAccessToken();
        if (token) return token;
    } catch (e) { /* ignore */ }

    // Fallback to gcloud
    try {
        const gcloudCmd = process.platform === 'win32'
            ? '"C:\\Users\\David\\AppData\\Local\\Google\\Cloud SDK\\google-cloud-sdk\\bin\\gcloud.cmd" auth print-access-token'
            : 'gcloud auth print-access-token';
        const token = execSync(gcloudCmd, { encoding: 'utf-8', shell: true }).trim();
        if (token && token.length > 20) return token;
    } catch (e) { }

    return undefined;
}

export async function generateEmbedding(text: string): Promise<number[] | null> {
    if (!text) return null;

    // Truncate to avoid limit (Vertex limit is 2048 tokens approx 8000 chars)
    const truncated = text.substring(0, 8000);

    const accessToken = await getAccessToken();
    if (!accessToken) {
        console.error('[Vectorizer] No access token');
        return null;
    }

    const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${LOCATION}/publishers/google/models/${MODEL}:predict`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                instances: [{ content: truncated }]
            })
        });

        if (!response.ok) {
            console.error(`[Vectorizer] API Error: ${response.status} ${await response.text()}`);
            return null;
        }

        const data: any = await response.json();
        const embedding = data.predictions?.[0]?.embeddings?.values;

        if (Array.isArray(embedding)) {
            return embedding;
        }
    } catch (e: any) {
        console.error(`[Vectorizer] Failed: ${e.message}`);
    }
    return null;
}
