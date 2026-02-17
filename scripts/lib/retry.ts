export async function withRetry<T>(
    fn: () => Promise<T>,
    opts: {
        retries?: number;
        baseDelayMs?: number;
        maxDelayMs?: number;
        shouldRetry?: (err: any) => boolean;
    } = {}
): Promise<T> {
    const retries = opts.retries ?? 3;
    const baseDelay = opts.baseDelayMs ?? 600;
    const maxDelay = opts.maxDelayMs ?? 5000;

    let lastErr: any;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (err: any) {
            lastErr = err;
            if (attempt === retries) break;

            const shouldRetry = opts.shouldRetry ? opts.shouldRetry(err) : true;
            if (!shouldRetry) throw err;

            // Exponential backoff + jitter
            const delay = Math.min(
                maxDelay,
                baseDelay * Math.pow(2, attempt) + Math.random() * 100
            );

            console.warn(`[Retry] Attempt ${attempt + 1} failed. Retrying in ${Math.round(delay)}ms...`);
            await new Promise(r => setTimeout(r, delay));
        }
    }
    throw lastErr;
}

export async function runWithConcurrency<T, R>(
    items: T[],
    concurrency: number,
    fn: (item: T) => Promise<R>
): Promise<R[]> {
    const results: R[] = [];
    const chunks = [];

    // Simple chunking
    for (let i = 0; i < items.length; i += concurrency) {
        chunks.push(items.slice(i, i + concurrency));
    }

    for (const chunk of chunks) {
        const chunkResults = await Promise.all(chunk.map(fn));
        results.push(...chunkResults);
    }

    return results;
}
