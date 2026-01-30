/**
 * Helper utilities for CITY_NEWS_HUB implementation
 */

/**
 * Converts city names to URL-friendly ASCII slugs.
 * 
 * Rules:
 * - Converts umlauts: ä→ae, ö→oe, ü→ue, ß→ss
 * - Lowercase
 * - Spaces → hyphens
 * - Removes punctuation
 * 
 * Examples:
 * - "Düsseldorf" → "duesseldorf"
 * - "Köln" → "koeln"
 * - "Freiburg im Breisgau" → "freiburg-im-breisgau"
 * - "München" → "muenchen"
 */
export function slugify_ascii_lower(text: string): string {
    return text
        .toLowerCase()
        // Convert German umlauts
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        // Replace non-alphanumeric with hyphens
        .replace(/[^a-z0-9]+/g, '-')
        // Remove leading/trailing hyphens
        .replace(/^-+|-+$/g, '');
}

/**
 * Action strength classification for news items.
 */
export type ActionStrength = 'strong' | 'weak_or_none';

export interface ActionClassification {
    strength: ActionStrength;
    priority: 'HIGH' | 'MEDIUM';
    allowPush: boolean;
    matchedTriggers: string[];
}

/**
 * Strong action trigger keywords (German)
 * These indicate user must take immediate action.
 */
const STRONG_ACTION_TRIGGERS = [
    // Deadlines
    'frist',
    'spätestens',
    'spaetestens',
    'bis zum',
    'deadline',
    'abgabetermin',
    'enddatum',

    // Required documents
    'unterlagen',
    'nachweis',
    'mitbringen',
    'vorlegen',
    'einreichen',
    'dokument',

    // Mandatory appointments
    'termin',
    'online buchen',
    'buchung',
    'terminvereinbarung',
    'anmeldung',

    // Required presence
    'vorsprache',
    'persönlich',
    'persoenlich',
    'pflicht',
    'verpflichtung',
    'erscheinen',

    // Payment issues
    'zahlung',
    'eingestellt',
    'stopp',
    'rückforderung',
    'rueckforderung',
    'gesperrt',
    'ausgesetzt'
];

/**
 * Classifies action strength of content based on trigger keywords.
 * 
 * @param content - Text to analyze (title + body)
 * @param keywords - Already matched keywords (Ukraine/migration)
 * @returns ActionClassification with priority and push decision
 */
export function classifyActionStrength(
    content: string,
    keywords: string[]
): ActionClassification {
    const lowerContent = content.toLowerCase();

    // Find matched strong triggers
    const matchedTriggers = STRONG_ACTION_TRIGGERS.filter(trigger =>
        lowerContent.includes(trigger)
    );

    if (matchedTriggers.length > 0) {
        // Strong action detected
        return {
            strength: 'strong',
            priority: 'HIGH',
            allowPush: true,
            matchedTriggers
        };
    } else {
        // Keywords present but no strong action triggers
        return {
            strength: 'weak_or_none',
            priority: 'MEDIUM',
            allowPush: false,
            matchedTriggers: []
        };
    }
}

/**
 * Ukraine/migration keyword sets for filtering
 */
export const UKRAINE_KEYWORDS = {
    de_en: [
        'ukraine',
        'ukrain',
        'gefluecht',
        'flucht',
        'geflücht',
        'migration',
        'integration',
        'aufenthalt',
        'aufenthaltstitel',
        '§24',
        'paragraf 24',
        'auslaenderbehoerde',
        'ausländerbehörde',
        'jobcenter',
        'buergergeld',
        'bürgergeld',
        'unterkunft',
        'termin',
        'frist',
        'unterlagen',
        'vorsprache',
        'pflicht',
        'zahlung',
        'eingestellt'
    ],
    ua: [
        'україн',
        'біжен',
        'міграц',
        'інтеграц',
        'документ',
        'термін',
        'запис',
        'прийом',
        'довідк',
        'виплат',
        'припинен',
        'обов'
    ]
};

/**
 * Checks if content contains Ukraine/migration keywords.
 * 
 * @param content - Text to check
 * @returns Array of matched keywords
 */
export function extractUkraineKeywords(content: string): string[] {
    const lowerContent = content.toLowerCase();
    const matched: string[] = [];

    const allKeywords = [...UKRAINE_KEYWORDS.de_en, ...UKRAINE_KEYWORDS.ua];

    for (const keyword of allKeywords) {
        if (lowerContent.includes(keyword)) {
            matched.push(keyword);
        }
    }

    return matched;
}

/**
 * Validates if URL matches city domain patterns.
 * 
 * @param url - URL to validate
 * @param citySlug - City slug (e.g., "leipzig", "muenchen")
 * @returns true if URL is allowlisted
 */
export function isAllowedCityURL(url: string, citySlug: string): boolean {
    const lowerURL = url.toLowerCase();

    // Reject patterns (check first)
    const rejectPatterns = [
        /veranstalt/,
        /event/,
        /kultur/,
        /sport/,
        /tourismus/,
        /pressefoto/,
        /nachrichten/ // general news, not official
    ];

    // Check rejects first
    for (const pattern of rejectPatterns) {
        if (pattern.test(lowerURL)) {
            return false;
        }
    }

    // Allow patterns - more permissive
    const allowPatterns = [
        new RegExp(`${citySlug}.*\\.de`), // city name in domain
        /\.de\/.*ukraine/, // .de domain with ukraine in path
        /\.de\/.*migration/,
        /rathaus/,
        /buergerservice/,
        /service-portal/,
        /termin/,
        /auslaender/,
        /jobcenter/
    ];

    // Check allows
    for (const pattern of allowPatterns) {
        if (pattern.test(lowerURL)) {
            return true;
        }
    }

    return false;
}

/**
 * Verifies that a URL is reachable (HTTP 200 OK).
 * Used to filter out dead links from search results.
 * 
 * @param url - URL to check
 * @param timeoutMs - Timeout in milliseconds (default 5000)
 * @returns true if reachable, false if 404/500/timeout
 */
export async function validateUrlHealth(url: string, timeoutMs: number = 5000): Promise<boolean> {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        // Try HEAD first to save bandwidth
        const response = await fetch(url, {
            method: 'HEAD',
            signal: controller.signal as AbortSignal,
            headers: { 'User-Agent': 'CityNewsHub-HealthCheck/1.0' }
        });

        clearTimeout(timeout);

        if (response.ok) {
            return true;
        }

        // Some servers reject HEAD (405 Method Not Allowed), try GET
        if (response.status === 405 || response.status === 403 || response.status === 401) {
            const controllerGet = new AbortController();
            const timeoutGet = setTimeout(() => controllerGet.abort(), timeoutMs);

            const responseGet = await fetch(url, {
                method: 'GET',
                signal: controllerGet.signal as AbortSignal,
                headers: { 'User-Agent': 'CityNewsHub-HealthCheck/1.0' }
            });
            clearTimeout(timeoutGet);
            return responseGet.ok;
        }

        return false;
    } catch (error) {
        return false;
    }
}

/**
 * Checks if a URL looks like a "Deep Link" to an article, not a landing page.
 */
export function isDeepLink(url: string): boolean {
    try {
        const u = new URL(url);
        // Root domain or simple path /news/ is NOT a deep link
        if (u.pathname === '/' || u.pathname.match(/^\/[a-z0-9-]+\/?$/)) {
            return false;
        }

        // Deep link usually has depth > 1 or specific extensions
        const parts = u.pathname.split('/').filter(p => p.length > 0);
        if (parts.length >= 2) return true;

        if (url.endsWith('.html') || url.endsWith('.php') || url.endsWith('.pdf')) return true;

        return false;
    } catch (e) {
        return false;
    }
}

/**
 * Validates if content is "recent" (within last 30 days) or explicitly mentions current/next year.
 * Parses dates like DD.MM.YYYY from content.
 */
export function isRecentNews(content: string, url: string = ''): boolean {
    const text = (content + " " + url).toLowerCase();
    const currentYear = new Date().getFullYear(); // 2026

    // 1. Reject explicit old years if 2026/2025/2027 is NOT present
    if (text.includes('2021') || text.includes('2022') || text.includes('2023') || text.includes('2024')) {
        // Stricter: if 2024 is found, we demand 2026 or 2025 (late) or 2027
        if (!text.includes('2026') && !text.includes('2025') && !text.includes('2027')) {
            return false;
        }
    }

    // 2. Parse specific dates: DD.MM.YYYY
    const dateRegex = /(\d{1,2})\.(\d{1,2})\.(\d{4})/g;
    let match;
    const now = new Date(); // 2026-01-30 in this environment
    const cutoff = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000); // Allow last 60 days

    while ((match = dateRegex.exec(text)) !== null) {
        const d = parseInt(match[1]);
        const m = parseInt(match[2]) - 1; // Month is 0-indexed
        const y = parseInt(match[3]);

        if (y < 2000) continue; // Ignore garbage

        const date = new Date(y, m, d);
        if (!isNaN(date.getTime()) && date < cutoff) {
            // Found a valid date that is too old (e.g. 01.01.2025)
            // But verify it's not a future date (e.g. deadline until 2024 - unlikely)
            // If date is truly old, reject
            return false;
        }
    }

    return true;
}
