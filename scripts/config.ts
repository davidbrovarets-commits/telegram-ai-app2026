
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

// Official Source Registry v1.0
export const SOURCES: SourceConfig[] = [
    // === DE (Federal) ===
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
        parser_notes: 'Only official news and warnings. Exclude HR/B2B content.',
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
        parser_notes: 'Primary source of truth for §24 and refugee rules.',
        enabled: true
    },
    {
        source_id: 'de_g4u_start',
        source_name: 'Germany4Ukraine Portal',
        scope: 'DE',
        geo: { country: 'DE' },
        base_url: 'https://www.germany4ukraine.de/DE/startseite_node.html',
        default_topics: ['status', 'documents', 'life_in_de', 'help'],
        default_priority: 'MEDIUM',
        default_actions: ['info'],
        dedupe_group: 'de_status',
        parser_notes: 'Government aggregator. Track changes of key sections.',
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
        parser_notes: 'Only rule changes and official explanations.',
        enabled: true
    },

    // === LAND (Sachsen) ===
    {
        source_id: 'land_snx_ukrainehilfe',
        source_name: 'Sachsen — Ukrainehilfe Portal',
        scope: 'LAND',
        geo: { country: 'DE', land: 'Sachsen' },
        base_url: 'https://www.ukrainehilfe.sachsen.de/',
        default_topics: ['status', 'documents', 'housing', 'benefits', 'work', 'children', 'health'],
        default_priority: 'HIGH',
        default_actions: ['procedure_change', 'info'],
        dedupe_group: 'land_snx_main',
        parser_notes: 'Main official portal for Saxony.',
        enabled: true
    },
    {
        source_id: 'land_snx_lds_ukr_aktuelles',
        source_name: 'Landesdirektion Sachsen',
        scope: 'LAND',
        geo: { country: 'DE', land: 'Sachsen' },
        base_url: 'https://www.lds.sachsen.de/asyl/?ID=23075&art_param=917',
        default_topics: ['status', 'procedures', 'accommodation', 'distribution'],
        default_priority: 'HIGH',
        default_actions: ['procedure_change', 'document_required', 'info'],
        dedupe_group: 'land_snx_lds',
        parser_notes: 'Administrative instructions for municipalities.',
        enabled: true
    },
    {
        source_id: 'land_snx_smk_daz_tag',
        source_name: 'SMK Sachsen — DaZ',
        scope: 'LAND',
        geo: { country: 'DE', land: 'Sachsen' },
        base_url: 'https://www.bildung.sachsen.de/blog/index.php/tag/daz/',
        default_topics: ['children', 'school', 'language_integration'],
        default_priority: 'MEDIUM',
        default_actions: ['info'],
        dedupe_group: 'land_snx_edu',
        parser_notes: 'Only practical changes affecting access or rules.',
        enabled: true
    },

    // === CITY (Leipzig) ===
    {
        source_id: 'city_le_jc_aktuelles',
        source_name: 'Jobcenter Leipzig',
        scope: 'CITY',
        geo: { country: 'DE', land: 'Sachsen', city: 'Leipzig' },
        base_url: 'https://jobcenter-leipzig.de/aktuelles/',
        default_topics: ['jobcenter', 'benefits', 'documents', 'appointments'],
        default_priority: 'HIGH',
        default_actions: ['deadline', 'document_required', 'appointment'],
        dedupe_group: 'city_le_jobcenter',
        parser_notes: 'Primary action feed for Leipzig.',
        enabled: true
    },
    {
        source_id: 'city_le_ukraine_hilfe',
        source_name: 'Leipzig — Ukraine Hilfe',
        scope: 'CITY',
        geo: { country: 'DE', land: 'Sachsen', city: 'Leipzig' },
        base_url: 'https://www.leipzig.de/leben-in-leipzig/soziales/migration-und-integration/ukraine-hilfe',
        default_topics: ['status', 'first_steps', 'help', 'housing'],
        default_priority: 'HIGH',
        default_actions: ['procedure_change', 'info'],
        dedupe_group: 'city_le_ukraine',
        parser_notes: 'Only practical changes. No general city news.',
        enabled: true
    },
    {
        source_id: 'city_le_auslaenderbehoerde',
        source_name: 'Leipzig — Ausländerbehörde',
        scope: 'CITY',
        geo: { country: 'DE', land: 'Sachsen', city: 'Leipzig' },
        base_url: 'https://www.leipzig.de/service-portal/dienststelle/auslaenderbehoerde-327',
        default_topics: ['status', 'documents', 'appointments'],
        default_priority: 'HIGH',
        default_actions: ['appointment', 'document_required', 'status_risk'],
        dedupe_group: 'city_le_status',
        parser_notes: 'Any change in procedure or availability is critical.',
        enabled: true
    },
    {
        source_id: 'city_le_termine',
        source_name: 'Leipzig — Online Termine',
        scope: 'CITY',
        geo: { country: 'DE', land: 'Sachsen', city: 'Leipzig' },
        base_url: 'https://www.leipzig.de/service-portal/aemtertermine-online',
        default_topics: ['appointments'],
        default_priority: 'HIGH',
        default_actions: ['appointment'],
        dedupe_group: 'city_le_termine',
        parser_notes: 'Track changes in appointment availability or rules.',
        enabled: true
    }
];
