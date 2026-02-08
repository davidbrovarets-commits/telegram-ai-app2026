
export type FetchErrorKind =
    | 'AUTH_REQUIRED'
    | 'RETRYABLE'
    | 'CIRCUIT_OPEN'
    | 'BAD_REQUEST'
    | 'NOT_FOUND'
    | 'UNKNOWN'
    | 'TIMEOUT';

export interface FetchError {
    kind: FetchErrorKind;
    status?: number;
    message: string;
}

interface FetchOptions {
    key: string;            // Unique key for single-flight and circuit breaker (e.g. 'feed:berlin')
    fn: () => Promise<any>; // The actual async fetch function
    maxAttempts?: number;   // Default 4
}

// Global State (In-Memory)
const flightMap = new Map<string, Promise<any>>();
const circuitBreakers = new Map<string, { failures: number; openUntil: number }>();

// Constants
const CB_THRESHOLD = 3;
const CB_DURATION_MS = 90_000; // 90s
const BASE_DELAY_MS = 400;
const MAX_ATTEMPTS = 4;
const TIMEOUT_MS = 10_000;

export async function defensiveFetch<T>(opts: FetchOptions): Promise<{ data?: T; error?: FetchError }> {
    const { key, fn, maxAttempts = MAX_ATTEMPTS } = opts;

    console.info(`[net] start`, { key });

    // 1. Single Flight
    if (flightMap.has(key)) {
        console.info(`[net] join-flight`, { key });
        return flightMap.get(key) as Promise<{ data?: T; error?: FetchError }>;
    }

    // 2. Circuit Breaker Check
    const cb = circuitBreakers.get(key);
    if (cb && cb.openUntil > Date.now()) {
        console.warn(`[net] circuit-open`, { key, openUntil: cb.openUntil });
        return { error: { kind: 'CIRCUIT_OPEN', message: 'Circuit breaker is open' } };
    }

    // Create the promise
    const promise = (async (): Promise<{ data?: T; error?: FetchError }> => {
        let attempt = 0;

        while (attempt < maxAttempts) {
            attempt++;

            // Check NetSim flags (if available globally)
            if (typeof window !== 'undefined' && (window as any).__NETSIM__) {
                const sim = (window as any).__NETSIM__;
                if (sim.offline) throw new Error('NetworkError: simulated offline'); // Throw to trigger retry logic
                if (sim.force401) return { error: { kind: 'AUTH_REQUIRED', status: 401, message: 'Simulated 401' } };
                if (sim.latency > 0) await new Promise(r => setTimeout(r, sim.latency));
            }

            try {
                // Time-boxed execution
                const result = await Promise.race([
                    fn(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), TIMEOUT_MS))
                ]);

                // Success
                console.info(`[net] success`, { key, attempt });
                // Reset circuit breaker on success
                circuitBreakers.delete(key);
                return { data: result };

            } catch (err: any) {
                const status = err?.status || err?.code || 500;
                const msg = err?.message || 'Unknown error';

                // Classify Error
                let kind: FetchErrorKind = 'UNKNOWN';

                if (msg === 'TIMEOUT') kind = 'TIMEOUT' as FetchErrorKind;
                else if (status === 401 || status === 403 || msg.includes('Auth')) kind = 'AUTH_REQUIRED' as FetchErrorKind;
                else if (status === 404) kind = 'NOT_FOUND' as FetchErrorKind;
                else if ([400, 422].includes(status)) kind = 'BAD_REQUEST' as FetchErrorKind;
                else if ([408, 429, 500, 502, 503, 504].includes(status) || msg.includes('Network') || msg.includes('fetch') || msg.includes('offline')) kind = 'RETRYABLE' as FetchErrorKind;
                else kind = 'UNKNOWN' as FetchErrorKind; // Treat unknown as retryable? No, usually fatal logic error.

                console.warn(`[net] fail`, { key, attempt, kind, status });

                // NON-RETRYABLE logic
                if (kind === 'AUTH_REQUIRED') return { error: { kind, status, message: msg } };
                if (kind === 'BAD_REQUEST') return { error: { kind, status, message: msg } };
                if (kind === 'NOT_FOUND') return { error: { kind, status, message: msg } };

                // RETRYABLE logic
                if (kind === 'RETRYABLE' || kind === 'TIMEOUT') {
                    if (attempt >= maxAttempts) {
                        // Max retries reached -> Trip Breaker?
                        const currentFailures = (circuitBreakers.get(key)?.failures || 0) + 1;
                        if (currentFailures >= CB_THRESHOLD) {
                            circuitBreakers.set(key, { failures: currentFailures, openUntil: Date.now() + CB_DURATION_MS });
                        } else {
                            circuitBreakers.set(key, { failures: currentFailures, openUntil: 0 });
                        }
                        return { error: { kind: 'RETRYABLE', message: `Max attempts reached: ${msg}` } };
                    }

                    // Backoff with Jitter
                    const delay = Math.min(BASE_DELAY_MS * Math.pow(2, attempt - 1), 5000);
                    const jitter = delay * 0.3 * (Math.random() * 2 - 1); // +/- 30%
                    await new Promise(r => setTimeout(r, delay + jitter));
                    continue;
                }

                // Unknown error (fallback)
                const unknownError: FetchError = { kind: 'UNKNOWN', message: msg };
                return { error: unknownError };
            }
        }
        return { error: { kind: 'UNKNOWN' as FetchErrorKind, message: 'Loop finished unexpectedly' } };
    })();

    flightMap.set(key, promise);

    try {
        return await promise;
    } finally {
        flightMap.delete(key);
    }
}
