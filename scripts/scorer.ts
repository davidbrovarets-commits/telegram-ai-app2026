
import type { Priority } from './config';

export interface ScoredItem {
    priority: Priority;
    type: 'IMPORTANT' | 'INFO' | 'FUN';
    score: number;
    actions: string[];
    topics: string[];
    expires_at: Date;
}

// Keywords for priority detection
const KEYWORDS = {
    HIGH: ['frist', 'deadline', 'termin', 'sanktion', 'sperrzeit', '§24', 'aufenthaltstitel', 'ablauf', 'pflicht', 'muss', 'erforderlich'],
    MEDIUM: ['änderung', 'neu', 'wichtig', 'achtung', 'hinweis', 'regel', 'gesetz', 'aktualisiert'],
    LOW: ['info', 'veranstaltung', 'tipp']
};

// Action tag detection
const ACTION_TAGS: Record<string, string[]> = {
    'deadline': ['frist', 'deadline', 'bis zum', 'spätestens', 'termin'],
    'document_required': ['unterlagen', 'dokumente', 'nachweis', 'antrag', 'formular', 'mitbringen'],
    'appointment': ['termin', 'vorsprache', 'einladung', 'buchen'],
    'payment_change': ['auszahlung', 'geld', 'leistung', 'euro', 'betrag', 'bürgergeld'],
    'status_risk': ['sanktion', 'sperrzeit', 'ablehnung', 'verlust', 'entzug', 'kürzung'],
    'procedure_change': ['änderung', 'neu', 'verfahren', 'prozess', 'ab sofort']
};

// Expiry calculation based on action types
function calculateExpiry(actions: string[], publishedAt: Date): Date {
    const result = new Date(publishedAt);

    // Deadline/appointment → expires in 2 days
    if (actions.includes('deadline') || actions.includes('appointment')) {
        result.setDate(result.getDate() + 2);
        return result;
    }

    // Procedure changes → expires in 30 days
    if (actions.includes('procedure_change')) {
        result.setDate(result.getDate() + 30);
        return result;
    }

    // Default (info) → expires in 14 days
    result.setDate(result.getDate() + 14);
    return result;
}

export function calculateScore(
    text: string,
    baseScore: number,
    scope: string,
    defaultActions: string[] = [],
    defaultPriority: Priority = 'LOW'
): ScoredItem {
    const lowerText = text.toLowerCase();
    let score = baseScore;
    let priority: Priority = defaultPriority;
    const actions: Set<string> = new Set(defaultActions);
    const topics: Set<string> = new Set();

    // 1. Keyword-based Priority
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

    // 2. Action Tag Detection
    for (const [tag, kws] of Object.entries(ACTION_TAGS)) {
        for (const kw of kws) {
            if (lowerText.includes(kw)) {
                actions.add(tag);
            }
        }
    }

    // 3. Scope Bonus
    if (scope === 'CITY') score += 10;
    if (scope === 'LAND') score += 5;

    // 4. Final Priority Threshold
    if (score >= 50) priority = 'HIGH';
    else if (score >= 30) priority = 'MEDIUM';

    // 5. Determine Type (L6 Logic)
    let type: 'IMPORTANT' | 'INFO' | 'FUN' = 'INFO'; // Default

    if (priority === 'HIGH') {
        type = 'IMPORTANT';
    } else {
        // Detect FUN
        const funKeywords = ['festival', 'konzert', 'ausstellung', 'kultur', 'event', 'party', 'weekend', 'wochenende', 'museum', 'galerie', 'theater', 'kino'];
        if (funKeywords.some(kw => lowerText.includes(kw))) {
            type = 'FUN';
        }
    }

    // 6. Calculate Expiry
    const actionsArray = Array.from(actions);
    const expires_at = calculateExpiry(actionsArray, new Date());

    return {
        priority,
        score,
        type,
        actions: actionsArray,
        topics: Array.from(topics),
        expires_at
    };
}
