/**
 * CITY_NEWS_HUB Source Template Generator
 * 
 * Generates discovery-based news sources for city packages.
 * Uses web search to find official city portal updates containing
 * Ukraine/migration keywords + action triggers.
 */

import type { SourceConfig } from './config';
import { slugify_ascii_lower, UKRAINE_KEYWORDS } from './helpers';

export interface CityInfo {
    name: string;      // e.g., "Leipzig", "München"
    code: string;      // e.g., "LEJ", "MUC"
    land: string;      // e.g., "Sachsen", "Bayern"
    package_id: string; // e.g., "city_LEJ"
}

/**
 * Generates web search queries for discovering city portal content.
 * 
 * @param city - City name
 * @returns Array of search queries
 */
function generateSearchQueries(city: string): string[] {
    return [
        `${city} Stadt Ukraine Inform ationen`,
        `${city} Ukraine Hilfe Aufenthalt §24`,
        `${city} Migration Integration Gefluechtete`,
        `${city} Auslaenderbehoerde Termin §24`,
        `${city} Jobcenter Termin Unterlagen Frist`,
        `${city} Aufenthaltstitel Verlaengerung Termin`,
        `${city} Leistungszahlung eingestellt Jobcenter`,
        `${city} Vorsprache erforderlich Unterlagen`
    ];
}

/**
 * Generates URL allowlist patterns for city.
 * 
 * @param citySlug - URL-safe city slug
 * @returns Regex patterns for URL filtering
 */
function generateAllowlistPatterns(citySlug: string): string[] {
    return [
        `.*\\b${citySlug}\\b.*\\.de/.*`,
        '.*stadt\\..*\\.de/.*',
        '.*rathaus.*',
        '.*buergerservice.*',
        '.*service-portal.*',
        '.*termin.*',
        '.*auslaender.*',
        '.*jobcenter.*'
    ];
}

/**
 * URL patterns to reject (events, culture, etc.)
 */
const REJECT_PATTERNS = [
    '.*veranstalt.*',
    '.*event.*',
    '.*kultur.*',
    '.*sport.*',
    '.*tourismus.*',
    '.*pressefoto.*'
];

/**
 * Action trigger keywords (German)
 */
const ACTION_TRIGGERS = [
    'frist', 'spätestens', 'spaetestens', 'bis zum', 'deadline',
    'unterlagen', 'nachweis', 'mitbringen',
    'termin', 'online buchen', 'buchung', 'terminvereinbarung',
    'vorsprache', 'persönlich', 'persoenlich', 'pflicht',
    'zahlung', 'eingestellt', 'stopp', 'rückforderung', 'rueckforderung'
];

/**
 * Generates CITY_NEWS_HUB source configuration for a city.
 * 
 * @param cityInfo - City metadata
 * @returns SourceConfig for NEWS_HUB
 */
export function generateCityNewsHub(cityInfo: CityInfo): any {
    const citySlug = slugify_ascii_lower(cityInfo.name);

    return {
        source_id: `city_${cityInfo.code.toLowerCase()}_news_hub`,
        source_name: `${cityInfo.name} — News Hub (Action Filter)`,
        scope: 'CITY',
        geo: {
            country: 'DE',
            land: cityInfo.land,
            city: cityInfo.name
        },

        // Discovery configuration (extends SourceConfig)
        mode: 'DISCOVER_AND_FILTER',
        base_url: `https://www.google.com/search?q=${encodeURIComponent(cityInfo.name + ' Ukraine')}`,

        discovery: {
            provider: 'WEB_SEARCH',
            max_results: 25,
            queries: generateSearchQueries(cityInfo.name),
            city_slug: citySlug
        },

        allowlist: {
            url_must_match_any: generateAllowlistPatterns(citySlug),
            reject_if_match_any: REJECT_PATTERNS
        },

        filters: {
            keywords_any: {
                de_en: UKRAINE_KEYWORDS.de_en,
                ua: UKRAINE_KEYWORDS.ua
            },

            action_triggers_any: ACTION_TRIGGERS,

            action_strength_rules: [
                {
                    if: { keywords: true, action_triggers: 'strong' },
                    then: { priority: 'HIGH', push: 'ALLOW' }
                },
                {
                    if: { keywords: true, action_triggers: 'weak_or_none' },
                    then: { priority: 'MEDIUM', push: 'BLOCK' }
                }
            ]
        },

        // Standard SourceConfig fields
        default_topics: ['ukraine', 'migration', 'deadlines', 'documents'],
        default_priority: 'HIGH',
        default_actions: ['deadline', 'document_required', 'appointment', 'info'],
        dedupe_group: `city_${cityInfo.code.toLowerCase()}_news_hub`,

        parser_notes: 'FALLBACK: Web search-based discovery for official city portal content. Filters by Ukraine/migration keywords + action triggers. Strong action→HIGH+push, weak→MEDIUM+no push. Prevents spam via dedupe + rate-limit.',

        enabled: true
    };
}

/**
 * Validates that a NEWS_HUB source is correctly configured.
 * 
 * @param source - Source to validate
 * @returns true if valid
 */
export function validateNewsHubSource(source: any): boolean {
    // Check required fields
    if (!source.source_id || !source.source_id.endsWith('_news_hub')) {
        return false;
    }

    if (!source.mode || source.mode !== 'DISCOVER_AND_FILTER') {
        return false;
    }

    if (!source.discovery || source.discovery.provider !== 'WEB_SEARCH') {
        return false;
    }

    if (!source.filters || !source.filters.keywords_any || !source.filters.action_triggers_any) {
        return false;
    }

    return true;
}
