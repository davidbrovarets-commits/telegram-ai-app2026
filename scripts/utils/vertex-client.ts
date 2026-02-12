
import { GoogleAuth } from 'google-auth-library';
import { execSync } from 'child_process';

/**
 * Configuration for Vertex AI Client
 */

/**
 * Configuration for Vertex AI Client
 */
export interface VertexClientConfig {
    projectId?: string;
    location?: string;
    modelId?: string; // Default text model
    imagenModelId?: string; // Default image model
    concurrency?: number; // Max parallel requests
    rpm?: number; // Max requests per minute
    maxRetries?: number;
    baseBackoffMs?: number;
}

/**
 * Task queue item for rate limiting
 */
interface Task<T> {
    fn: () => Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: any) => void;
}

/**
 * Centralized Vertex AI Client with:
 * 1. Automatic Authentication (Env -> GCloud CLI -> GoogleAuth)
 * 2. Rate Limiting (Token Bucket / Queue)
 * 3. Exponential Backoff for 429/503/500 errors
 */
export class VertexClient {
    private projectId: string;
    private location: string;
    private modelId: string;
    private imagenModelId: string;

    private queue: Task<any>[] = [];
    private activeRequests = 0;
    private maxConcurrency: number;
    private minRequestIntervalMs: number;
    private lastRequestTime = 0;

    // Hardening Config
    private maxRetries: number;
    private baseBackoffMs: number;

    constructor(config: VertexClientConfig = {}) {
        this.projectId = config.projectId || process.env.GOOGLE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'claude-vertex-prod';
        this.location = config.location || process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
        this.modelId = config.modelId || process.env.VERTEX_MODEL || 'gemini-2.5-pro';
        this.imagenModelId = config.imagenModelId || 'imagen-3.0-generate-001';

        // Concurrency & Rate Limit Knobs
        this.maxConcurrency = config.concurrency || parseInt(process.env.VERTEX_MAX_CONCURRENCY || '3', 10);
        const rpm = config.rpm || parseInt(process.env.VERTEX_RPM || '60', 10);
        this.minRequestIntervalMs = (60 * 1000) / rpm;

        // Retry Knobs
        this.maxRetries = config.maxRetries || parseInt(process.env.VERTEX_MAX_RETRIES || '6', 10);
        this.baseBackoffMs = config.baseBackoffMs || parseInt(process.env.VERTEX_BASE_BACKOFF_MS || '1000', 10);
    }

    /**
     * Get Access Token with Fallbacks
     */
    private async getAccessToken(): Promise<string> {
        // 1. Env Var
        if (process.env.GOOGLE_ACCESS_TOKEN) {
            return process.env.GOOGLE_ACCESS_TOKEN;
        }

        // 2. GCloud CLI (Fastest for local dev)
        try {
            const gcloudCmd = process.platform === 'win32'
                ? '& "C:\\Users\\David\\AppData\\Local\\Google\\Cloud SDK\\google-cloud-sdk\\bin\\gcloud.cmd" auth print-access-token'
                : 'gcloud auth print-access-token';

            const token = execSync(gcloudCmd, { encoding: 'utf-8', shell: 'powershell.exe' }).trim();
            if (token && token.length > 20) return token;
        } catch (e) {
            // Ignore (fallback to GoogleAuth)
        }

        // 3. GoogleAuth Library (Production / prolonged usage)
        try {
            const auth = new GoogleAuth({
                scopes: ['https://www.googleapis.com/auth/cloud-platform']
            });
            const client = await auth.getClient();
            const { token } = await client.getAccessToken();
            if (token) return token;
        } catch (e) {
            console.error('[VertexClient] Auth failed:', e);
        }

        throw new Error('Failed to get Google Access Token');
    }

    /**
     * Internal: Manage Queue Processing
     */
    private async processQueue() {
        if (this.activeRequests >= this.maxConcurrency || this.queue.length === 0) return;

        const now = Date.now();
        const timeSinceLast = now - this.lastRequestTime;

        if (timeSinceLast < this.minRequestIntervalMs) {
            const delay = this.minRequestIntervalMs - timeSinceLast;
            setTimeout(() => this.processQueue(), delay);
            return;
        }

        const task = this.queue.shift();
        if (!task) return;

        this.activeRequests++;
        this.lastRequestTime = Date.now();

        try {
            const result = await task.fn();
            task.resolve(result);
        } catch (e) {
            task.reject(e);
        } finally {
            this.activeRequests--;
            setTimeout(() => this.processQueue(), 0); // Process next
        }
    }

    /**
     * Internal: Enqueue a request
     */
    private enqueue<T>(fn: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push({ fn, resolve, reject });
            this.processQueue();
        });
    }

    private generateRid(): string {
        return Math.random().toString(36).substring(2, 10);
    }

    /**
     * Internal: Execute with Retry (Exponential Backoff + Jitter)
     */
    private async callWithRetry<T>(operationName: string, fn: () => Promise<T>, attempts = 0, rid?: string): Promise<T> {
        const myRid = rid || this.generateRid();

        if (attempts === 0) {
            console.log(`[VertexClient] ${operationName} start (rid=${myRid})`);
        }

        try {
            const start = Date.now();
            const res = await fn();
            const duration = Date.now() - start;
            console.log(`[VertexClient] ${operationName} success (rid=${myRid}, ${duration}ms)`);
            return res; // Success
        } catch (error: any) {
            const isRetryable =
                error.message?.includes('429') ||
                error.message?.includes('503') ||
                error.message?.includes('Quota exceeded') ||
                error.message?.includes('Resource exhausted') ||
                error.message?.includes('ETIMEDOUT') ||
                error.message?.includes('ECONNRESET');

            if (isRetryable && attempts < this.maxRetries) {
                // Exponential backoff: base * 2^attempts
                const exponential = this.baseBackoffMs * Math.pow(2, attempts);
                // Jitter: +/- 25% random
                const jitter = exponential * 0.25 * (Math.random() * 2 - 1);
                const delay = Math.max(0, exponential + jitter);

                console.warn(`[VertexClient] ${operationName} retry (rid=${myRid}, status=${error.message?.slice(0, 50)}..., wait=${Math.round(delay)}ms, attempt=${attempts + 1}/${this.maxRetries})`);

                await new Promise(r => setTimeout(r, delay));
                return this.callWithRetry(operationName, fn, attempts + 1, myRid);
            }

            console.error(`[VertexClient] ${operationName} fail (rid=${myRid}, finalStatus=${error.message})`);
            throw error;
        }
    }

    /**
     * Generate Text via Gemini (generateContent)
     */
    async generateJSON<T = any>(prompt: string, temp = 0.3): Promise<T> {
        return this.enqueue(() => this.callWithRetry('generateJSON', async () => {
            const token = await this.getAccessToken();
            const endpoint = `https://${this.location}-aiplatform.googleapis.com/v1beta1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${this.modelId}:generateContent`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: temp,
                        responseMimeType: 'application/json'
                    }
                })
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`Vertex AI JSON Error ${response.status}: ${err}`);
            }

            const data = await response.json() as any;
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) throw new Error('Empty response from Vertex AI');

            // Extract JSON if wrapped in markdown code blocks
            const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
            return JSON.parse(jsonStr);
        }));
    }

    async generateText(prompt: string, temp = 0.7): Promise<string> {
        return this.enqueue(() => this.callWithRetry('generateText', async () => {
            const token = await this.getAccessToken();
            const endpoint = `https://${this.location}-aiplatform.googleapis.com/v1beta1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${this.modelId}:generateContent`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: temp
                    }
                })
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`Vertex AI Text Error ${response.status}: ${err}`);
            }

            const data = await response.json() as any;
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            return text || '';
        }));
    }

    /**
     * Generate Image via Imagen (predict)
     */
    async generateImage(prompt: string, aspectRatio: string = "4:3"): Promise<string> {
        return this.enqueue(() => this.callWithRetry('generateImage', async () => {
            const token = await this.getAccessToken();
            // Imagen 3/4 uses 'predict' endpoint
            const endpoint = `https://${this.location}-aiplatform.googleapis.com/v1beta1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${this.imagenModelId}:predict`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    instances: [{ prompt }],
                    parameters: {
                        sampleCount: 1,
                        aspectRatio,
                        outputOptions: { mimeType: "image/png" }
                    }
                })
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`Vertex AI Image Error ${response.status}: ${err}`);
            }

            const data = await response.json() as any;
            const b64 = data.predictions?.[0]?.bytesBase64Encoded;

            if (!b64) throw new Error('No image data in Vertex response');

            return b64;
        }));
    }
}

// Singleton instance for shared rate limiting across the process
export const vertexClient = new VertexClient({
    // Config via Env vars is now supported by default inside constructor
});
