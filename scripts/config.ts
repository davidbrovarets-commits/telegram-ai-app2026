
import { SOURCE_REGISTRY } from './registries/source-registry';

export type Scope = 'DE' | 'LAND' | 'CITY';
export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface SourceConfig {
    source_id: string;
    source_name: string;
    scope: Scope;
    geo: {
        country: 'DE';
        land?: string;
        city?: string;
    };
    base_url: string;
    default_topics: string[];
    default_priority: Priority;
    default_actions: string[];
    dedupe_group: string;
    parser_notes: string;
    enabled: boolean;
}

// Map of prefixes to Bundesland names
const STATE_MAP: Record<string, string> = {
    'bw': 'Baden-Württemberg',
    'by': 'Bayern',
    'be': 'Berlin',
    'bb': 'Brandenburg',
    'hb': 'Bremen',
    'hh': 'Hamburg',
    'he': 'Hessen',
    'mv': 'Mecklenburg-Vorpommern',
    'ni': 'Niedersachsen',
    'nrw': 'Nordrhein-Westfalen',
    'rp': 'Rheinland-Pfalz',
    'sl': 'Saarland',
    'sn': 'Sachsen',
    'st': 'Sachsen-Anhalt',
    'sh': 'Schleswig-Holstein',
    'th': 'Thüringen'
};

import { CITY_REGISTRY } from '../src/config/cities';



// Transform shared registry to existing format { city, land }
const CITY_MAP: Record<string, { city: string, land: string }> = Object.entries(CITY_REGISTRY).reduce((acc, [key, val]) => {
    acc[key] = { city: val.name, land: val.land };
    return acc;
}, {} as Record<string, { city: string, land: string }>);

// Helper: infer scope/geo from source_id
function inferGeo(sourceId: string): { scope: Scope, geo: { country: 'DE', land?: string, city?: string } } {
    const prefix = sourceId.split('_')[0];

    // Check if prefix is a known City
    if (CITY_MAP[prefix]) {
        return {
            scope: 'CITY',
            geo: {
                country: 'DE',
                land: CITY_MAP[prefix].land,
                city: CITY_MAP[prefix].city
            }
        };
    }

    // Check if prefix is a known Bundesland code
    if (STATE_MAP[prefix]) {
        return {
            scope: 'LAND',
            geo: { country: 'DE', land: STATE_MAP[prefix] }
        };
    }

    // Default to Country (L1)
    return {
        scope: 'DE',
        geo: { country: 'DE' }
    };
}

// Transform Registry to SourceConfig
export const SOURCES: SourceConfig[] = SOURCE_REGISTRY.map(reg => {
    const { scope, geo } = inferGeo(reg.source_id);

    // Infer dedup group: simplified to source_id or prefix-based
    // For media outlets, we might want to group by outlet, but here we'll use source_id as base
    const dedupeGroup = reg.source_id;

    // Default topics/actions based on trust level or general rules
    // L6 doc says: "Match keywords: Ukraine, Ukrainer, Flüchtlinge..." (Agent 1 handles strict filtering)
    // Here we provide metadata hints.
    const defaultTopics = ['news', 'germany'];
    if (reg.trust_level.includes('official')) {
        defaultTopics.push('policy', 'official');
    }

    return {
        source_id: reg.source_id,
        source_name: reg.name, // Map 'name' to 'source_name'
        base_url: reg.base_url,
        scope: scope,
        geo: geo,
        default_topics: defaultTopics,
        default_priority: reg.default_priority as Priority,
        default_actions: ['info'], // Default action hint
        dedupe_group: dedupeGroup,
        parser_notes: `Trust: ${reg.trust_level}, Method: ${reg.ingestion_method}`,
        enabled: true
    };
});
