/**
 * Agent 2: Classifier
 * Purpose: Classify news by topic and type (IMPORTANT/INFO/FUN)
 */

export type NewsType = 'IMPORTANT' | 'INFO' | 'FUN';

export interface ClassificationResult {
    type: NewsType;
    topics: string[];
    relevance_score: number;
    reason: string;
}

// Topic detection patterns
const TOPIC_PATTERNS: Record<string, RegExp[]> = {
    'AUFENTHALT': [/§24/i, /aufenthalt/i, /aufenthaltserlaubnis/i, /paragraph 24/i],
    'BUERGERGELD': [/bürgergeld/i, /jobcenter/i, /sozialleistung/i, /sozialhilfe/i],
    'ARBEIT': [/arbeit/i, /arbeitserlaubnis/i, /job/i, /beschäftigung/i, /steuern/i],
    'WOHNUNG': [/wohnung/i, /miete/i, /unterkunft/i, /wohnungssuche/i],
    'INTEGRATION': [/integration/i, /sprachkurs/i, /deutschkurs/i, /integrationskurs/i],
    'GESETZ': [/gesetz/i, /bundestag/i, /verordnung/i, /bundesregierung/i, /bescheid/i],
    'UKRAINE': [/ukraine/i, /ukrainer/i, /geflüchtete/i, /flüchtling/i]
};

// Type classification rules
const IMPORTANT_TOPICS = ['GESETZ', 'AUFENTHALT', 'BUERGERGELD'];
const FUN_KEYWORDS = ['veranstaltung', 'fest', 'feier', 'kostenlos', 'gutschein', 'aktion'];

/**
 * Classify article into type and topics
 * @param text Combined title + content
 * @param keywordHits Keywords found by filter agent
 * @param sourceConfig Optional source configuration for priority hints
 */
export function classify(
    text: string,
    keywordHits: string[],
    sourceConfig?: { default_priority?: string }
): ClassificationResult {
    const lowerText = text.toLowerCase();

    // Detect topics
    const topics: string[] = [];
    for (const [topic, patterns] of Object.entries(TOPIC_PATTERNS)) {
        if (patterns.some(p => p.test(text))) {
            topics.push(topic);
        }
    }

    // Calculate relevance score
    let relevance_score = 20; // Base score
    relevance_score += keywordHits.length * 10; // +10 per keyword
    relevance_score += topics.length * 15; // +15 per topic

    // Source priority bonus
    if (sourceConfig?.default_priority === 'HIGH') {
        relevance_score += 20;
    } else if (sourceConfig?.default_priority === 'MEDIUM') {
        relevance_score += 10;
    }

    relevance_score = Math.min(100, relevance_score);

    // Determine type
    let type: NewsType = 'INFO'; // Default
    let reason = 'General information';

    // Check for IMPORTANT
    if (topics.some(t => IMPORTANT_TOPICS.includes(t))) {
        type = 'IMPORTANT';
        reason = `Contains critical topic: ${topics.filter(t => IMPORTANT_TOPICS.includes(t)).join(', ')}`;
    }
    // Check for FUN
    else if (FUN_KEYWORDS.some(kw => lowerText.includes(kw))) {
        type = 'FUN';
        reason = 'Contains event/action keywords';
    }
    // High priority sources default to IMPORTANT
    else if (sourceConfig?.default_priority === 'HIGH') {
        type = 'IMPORTANT';
        reason = 'High priority source';
    }

    return {
        type,
        topics,
        relevance_score,
        reason
    };
}
