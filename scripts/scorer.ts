
import { Priority } from './config';

export interface ScoredItem {
    priority: Priority;
    score: number;
    actions: string[];
    topics: string[];
}

const KEYWORDS = {
    HIGH: ['frist', 'deadline', 'termin', 'sanktion', 'sperrzeit', '§24', 'aufenthaltstitel', 'ablauf', 'expire'],
    MEDIUM: ['änderung', 'neu', 'wichtig', 'achtung', 'hinweis', 'regel', 'gesetz', 'programm'],
    LOW: ['info', 'veranstaltung', 'tipp']
};

const ACTION_TAGS: Record<string, string[]> = {
    'deadline': ['frist', 'deadline', 'bis zum', 'spätestens'],
    'document_required': ['unterlagen', 'dokumente', 'nachweis', 'antrag', 'formular'],
    'appointment': ['termin', 'vorsprache', 'einladung'],
    'payment_change': ['auszahlung', 'geld', 'leistung', 'euro', 'betrag'],
    'status_risk': ['sanktion', 'sperrzeit', 'ablehnung', 'verlust', 'entzug']
};

export function calculateScore(text: string, baseScore: number, scope: string): ScoredItem {
    const lowerText = text.toLowerCase();
    let score = baseScore;
    let priority: Priority = 'LOW';
    const actions: Set<string> = new Set();
    const topics: Set<string> = new Set(); // To be implemented with deeper taxonomy later

    // 1. Keyword Scoring
    for (const kw of KEYWORDS.HIGH) {
        if (lowerText.includes(kw)) {
            score += 40;
            priority = 'HIGH';
        }
    }

    if (priority !== 'HIGH') {
        for (const kw of KEYWORDS.MEDIUM) {
            if (lowerText.includes(kw)) {
                score += 20;
                if (priority === 'LOW') priority = 'MEDIUM';
            }
        }
    }

    // 2. Action Tagging
    for (const [tag, kws] of Object.entries(ACTION_TAGS)) {
        for (const kw of kws) {
            if (lowerText.includes(kw)) {
                actions.add(tag);
            }
        }
    }

    // 3. Scope Bonus (Reflects relevance "intensity")
    if (scope === 'CITY') score += 10;
    if (scope === 'LAND') score += 5;

    // Final Priority Adjustment based on thresholds
    if (score >= 50) priority = 'HIGH';
    else if (score >= 30) priority = 'MEDIUM';

    return {
        priority,
        score,
        actions: Array.from(actions),
        topics: Array.from(topics)
    };
}
