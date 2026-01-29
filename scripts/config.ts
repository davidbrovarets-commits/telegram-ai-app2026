
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

// Import Bundesland packages
import { NRW_PACKAGE, BAYERN_PACKAGE, BERLIN_PACKAGE, HAMBURG_PACKAGE, HESSEN_PACKAGE, BW_PACKAGE, BRANDENBURG_PACKAGE, BREMEN_PACKAGE, MV_PACKAGE, NI_PACKAGE, RP_PACKAGE, SL_PACKAGE, ST_PACKAGE, SH_PACKAGE, TH_PACKAGE } from './bundesland-packages';
import { LEIPZIG_PACKAGE, MUENCHEN_PACKAGE, KOELN_PACKAGE, FRANKFURT_PACKAGE, STUTTGART_PACKAGE, DUESSELDORF_PACKAGE, DORTMUND_PACKAGE, ESSEN_PACKAGE, HANNOVER_PACKAGE, NUERNBERG_PACKAGE, DRESDEN_PACKAGE } from './city-packages';

// =============================================
// DE — FEDERAL LEVEL SOURCES
// =============================================

const DE_SOURCES: SourceConfig[] = [
    {
        source_id: 'de_ba_news',
        source_name: 'Bundesagentur für Arbeit',
        scope: 'DE',
        geo: { country: 'DE' },
        base_url: 'https://www.arbeitsagentur.de/news',
        default_topics: ['work', 'benefits', 'security'],
        default_priority: 'MEDIUM',
        default_actions: ['info'],
        dedupe_group: 'de_ba',
        parser_notes: 'Only official news and warnings.',
        enabled: true
    },
    {
        source_id: 'de_bamf_ukraine',
        source_name: 'BAMF / Germany4Ukraine',
        scope: 'DE',
        geo: { country: 'DE' },
        base_url: 'https://www.bamf.de/DE/Themen/AsylFluechtlingsschutz/ResettlementRelocation/InformationenEinreiseUkraine/informationen-einreise-ukraine-node.html',
        default_topics: ['status', 'documents', 'housing', 'health', 'work', 'children'],
        default_priority: 'HIGH',
        default_actions: ['procedure_change', 'info'],
        dedupe_group: 'de_status',
        parser_notes: 'Primary source for §24 and refugee rules.',
        enabled: true
    },
    {
        source_id: 'de_g4u',
        source_name: 'Germany4Ukraine Portal',
        scope: 'DE',
        geo: { country: 'DE' },
        base_url: 'https://www.germany4ukraine.de/DE/startseite_node.html',
        default_topics: ['status', 'documents', 'life_in_de', 'help'],
        default_priority: 'MEDIUM',
        default_actions: ['info'],
        dedupe_group: 'de_status',
        parser_notes: 'Government aggregator.',
        enabled: true
    },
    {
        source_id: 'de_bmas_buergergeld',
        source_name: 'BMAS — Bürgergeld',
        scope: 'DE',
        geo: { country: 'DE' },
        base_url: 'https://www.bmas.de/DE/Arbeit/Grundsicherung-Buergergeld/grundsicherung-buergergeld.html',
        default_topics: ['benefits', 'jobcenter_rules'],
        default_priority: 'MEDIUM',
        default_actions: ['payment_change', 'info'],
        dedupe_group: 'de_bmas',
        parser_notes: 'Only rule changes.',
        enabled: true
    }
];

// =============================================
// LAND — SACHSEN
// =============================================

const SACHSEN_SOURCES: SourceConfig[] = [
    {
        source_id: 'land_sachsen_ukrainehilfe',
        source_name: 'Sachsen — Ukrainehilfe Portal',
        scope: 'LAND',
        geo: { country: 'DE', land: 'Sachsen' },
        base_url: 'https://www.ukrainehilfe.sachsen.de/',
        default_topics: ['status', 'documents', 'housing', 'benefits', 'work', 'children', 'health'],
        default_priority: 'HIGH',
        default_actions: ['procedure_change', 'info'],
        dedupe_group: 'land_sachsen_main',
        parser_notes: 'Main official portal for Saxony.',
        enabled: true
    },
    {
        source_id: 'land_sachsen_lds',
        source_name: 'Landesdirektion Sachsen',
        scope: 'LAND',
        geo: { country: 'DE', land: 'Sachsen' },
        base_url: 'https://www.lds.sachsen.de/asyl/?ID=23075&art_param=917',
        default_topics: ['status', 'procedures', 'accommodation', 'distribution'],
        default_priority: 'HIGH',
        default_actions: ['procedure_change', 'document_required', 'info'],
        dedupe_group: 'land_sachsen_lds',
        parser_notes: 'Administrative instructions.',
        enabled: true
    },
    {
        source_id: 'land_sachsen_smk_daz',
        source_name: 'SMK Sachsen — DaZ',
        scope: 'LAND',
        geo: { country: 'DE', land: 'Sachsen' },
        base_url: 'https://www.bildung.sachsen.de/blog/index.php/tag/daz/',
        default_topics: ['children', 'school', 'language_integration'],
        default_priority: 'MEDIUM',
        default_actions: ['info'],
        dedupe_group: 'land_sachsen_edu',
        parser_notes: 'Only practical education changes.',
        enabled: true
    }
];

// =============================================
// CITY — LEIPZIG
// =============================================

// LEIPZIG_SOURCES removed (Use LEIPZIG_PACKAGE from city-packages)

// =============================================
// COMBINED SOURCES EXPORT
// =============================================

export const SOURCES: SourceConfig[] = [
    ...DE_SOURCES,
    ...SACHSEN_SOURCES,
    ...LEIPZIG_PACKAGE,
    ...MUENCHEN_PACKAGE,
    ...KOELN_PACKAGE,
    ...FRANKFURT_PACKAGE,
    ...STUTTGART_PACKAGE,
    ...DUESSELDORF_PACKAGE,
    ...DORTMUND_PACKAGE,
    ...ESSEN_PACKAGE,
    ...HANNOVER_PACKAGE,
    ...NUERNBERG_PACKAGE,
    ...DRESDEN_PACKAGE,
    // Add more Bundesland packages below:
    ...NRW_PACKAGE,
    ...BAYERN_PACKAGE,
    ...HESSEN_PACKAGE,
    ...BW_PACKAGE,
    ...BERLIN_PACKAGE,
    ...BRANDENBURG_PACKAGE,
    ...BREMEN_PACKAGE,
    ...HAMBURG_PACKAGE,
    ...MV_PACKAGE,
    ...NI_PACKAGE,
    ...RP_PACKAGE,
    ...SL_PACKAGE,
    ...ST_PACKAGE,
    ...SH_PACKAGE,
    ...TH_PACKAGE,
];
