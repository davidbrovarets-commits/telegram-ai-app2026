import crypto from 'crypto';

export function normalizeTitle(title: string): string {
    return (title || '')
        .toLowerCase()
        .replace(/[^\w\säöüß]/g, '') // Remove punctuation
        .replace(/\s+/g, ' ')
        .trim();
}

export function urlKey(url: string): string {
    if (!url) return '';
    try {
        const u = new URL(url);
        // P1.2: Strip all known tracking params for canonical URL
        const TRACKING_PARAMS = [
            'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
            'fbclid', 'gclid', 'ref', 'source',
        ];
        for (const p of TRACKING_PARAMS) {
            u.searchParams.delete(p);
        }
        // Normalize: lowercase host, strip trailing slash
        u.hostname = u.hostname.toLowerCase();
        let clean = u.toString();
        if (clean.endsWith('/')) clean = clean.slice(0, -1);
        return clean;
    } catch {
        return url.replace(/\/$/, '');
    }
}

export function hashKey(input: string): string {
    return crypto.createHash('sha1').update(input).digest('hex');
}

export function isNearDuplicateTitle(titleA: string, titleB: string): boolean {
    const a = normalizeTitle(titleA);
    const b = normalizeTitle(titleB);
    if (a === b) return true;

    // Simple Jaccard similarity on tokens
    const setA = new Set(a.split(' '));
    const setB = new Set(b.split(' '));
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);

    if (union.size === 0) return false;
    return (intersection.size / union.size) >= 0.85;
}

export interface DedupResult<T> {
    kept: T[];
    dropped: T[];
}

export function dedupCandidates<T extends { raw: { title: string; url: string } }>(items: T[]): DedupResult<T> {
    const seenUrls = new Set<string>();
    const keptTitles: string[] = [];
    const kept: T[] = [];
    const dropped: T[] = [];

    for (const item of items) {
        const uKey = urlKey(item.raw.url);
        const tKey = normalizeTitle(item.raw.title);

        // 1. Exact URL dedup
        if (seenUrls.has(uKey)) {
            dropped.push(item);
            continue;
        }

        // 2. Exact title dedup
        if (keptTitles.includes(tKey)) {
            dropped.push(item);
            continue;
        }

        // 3. P1.2: Near-duplicate title dedup (Jaccard > 0.85)
        const isNearDup = keptTitles.some(existing => isNearDuplicateTitle(item.raw.title, existing));
        if (isNearDup) {
            dropped.push(item);
            continue;
        }

        seenUrls.add(uKey);
        keptTitles.push(tKey);
        kept.push(item);
    }

    return { kept, dropped };
}
