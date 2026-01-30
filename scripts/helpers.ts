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
