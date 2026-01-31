/**
 * Agent 1: Rule Filter
 * Purpose: Filter news items by required keywords for Ukrainian migrants in Germany
 */

// MANDATORY KEYWORDS - Article must contain at least one
export const REQUIRED_KEYWORDS = [
    // Migration/Residence
    'Ukraine', 'Ukrainer', 'Flüchtlinge', 'Flüchtling', 'Migration', 'Aufenthalt', '§24', 'Paragraph 24',
    'Asyl', 'Schutzsuchende', 'Geflüchtete',
    // Benefits
    'Jobcenter', 'Bürgergeld', 'Sozialhilfe', 'Sozialleistung', 'Arbeitslosengeld', 'ALG',
    // Work/Life
    'Arbeit', 'Arbeitserlaubnis', 'Steuern', 'Miete', 'Wohnung', 'Wohnungssuche',
    'Integration', 'Integrationskurs', 'Sprachkurs', 'Deutschkurs',
    // Legal/Government
    'Bundestag', 'Bundesregierung', 'Gesetz', 'Verordnung', 'Bescheid',
    'Ausländerbehörde', 'BAMF', 'Aufenthaltserlaubnis'
];

// Topics that should NEVER pass
export const BLACKLIST_KEYWORDS = [
    'Fußball', 'Sport', 'Konzert', 'Festival', 'Kino', 'Theater',
    'Wetter', 'Horoskop', 'Promi', 'Gewinnspiel'
];

export interface FilterResult {
    passes: boolean;
    hits: string[];
    blacklistHits: string[];
    score: number; // 0-100 based on keyword relevance
}

/**
 * Check if article text passes the keyword filter
 * @param text Combined title + content
 * @returns FilterResult with pass/fail and matched keywords
 */
export function passesFilter(text: string): FilterResult {
    const lowerText = text.toLowerCase();

    // Check blacklist first
    const blacklistHits = BLACKLIST_KEYWORDS.filter(kw =>
        lowerText.includes(kw.toLowerCase())
    );

    if (blacklistHits.length > 0) {
        return { passes: false, hits: [], blacklistHits, score: 0 };
    }

    // Check required keywords
    const hits = REQUIRED_KEYWORDS.filter(kw =>
        lowerText.includes(kw.toLowerCase())
    );

    // Score calculation
    let score = 0;
    if (hits.length > 0) {
        score = Math.min(100, 20 + (hits.length * 15)); // Base 20 + 15 per keyword, max 100
    }

    // Bonus for key combinations
    if (hits.includes('Ukraine') && (hits.includes('Bürgergeld') || hits.includes('Aufenthalt'))) {
        score = Math.min(100, score + 20);
    }

    return {
        passes: hits.length > 0,
        hits,
        blacklistHits: [],
        score
    };
}

/**
 * Check if text is relevant enough for inclusion
 * @param text Combined title + content
 * @param minScore Minimum score to pass (default 30)
 */
export function isRelevant(text: string, minScore: number = 30): boolean {
    const result = passesFilter(text);
    return result.passes && result.score >= minScore;
}
