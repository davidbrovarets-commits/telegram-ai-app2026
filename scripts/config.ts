
export type Scope = 'DE' | 'LAND' | 'CITY';
export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface SourceConfig {
    id: string;
    source_name: string;
    url: string;
    scope: Scope;
    geo: {
        country: 'DE';
        land?: string; // e.g. 'Sachsen'
        city?: string; // e.g. 'Leipzig'
    };
    parser: 'generic_html' | 'arbeitsagentur' | 'bamf' | 'sachsen_portal' | 'leipzig_city';
    parser_config?: {
        selector?: string;
        dateSelector?: string;
        linkSelector?: string;
    };
    baseScore: number;
    enabled: boolean;
}

export const SOURCES: SourceConfig[] = [
    // --- 1. DE LEVEL (Riiklik) ---
    {
        id: 'bamf_de',
        source_name: 'BAMF',
        url: 'https://www.bamf.de/DE/Themen/AsylFluechtlingsschutz/ResettlementRelocation/InformationenEinreiseUkraine/informationen-einreise-ukraine-node.html',
        scope: 'DE',
        geo: { country: 'DE' },
        parser: 'bamf',
        baseScore: 10,
        enabled: true
    },
    {
        id: 'arbeitsagentur_news',
        source_name: 'Bundesagentur für Arbeit',
        url: 'https://www.arbeitsagentur.de/news',
        scope: 'DE',
        geo: { country: 'DE' },
        parser: 'arbeitsagentur',
        baseScore: 5,
        enabled: true
    },
    {
        id: 'bmas_buergergeld',
        source_name: 'BMAS (Bürgergeld)',
        url: 'https://www.bmas.de/DE/Arbeit/Grundsicherung-Buergergeld/grundsicherung-buergergeld.html',
        scope: 'DE',
        geo: { country: 'DE' },
        parser: 'generic_html',
        baseScore: 10, // Official rules are important
        enabled: true
    },
    {
        id: 'integrationsbeauftragte',
        source_name: 'Integrationsbeauftragte',
        url: 'https://www.integrationsbeauftragte.de/ib-de/ich-moechte-mehr-wissen-ueber/flucht-und-asyl/aufenthaltstitel-verlaengern-sich-erneut-automatisch-um-ein-jahr-bis-zum-4-maerz-2027-2266260',
        scope: 'DE',
        geo: { country: 'DE' },
        parser: 'generic_html',
        baseScore: 20, // Very high priority (status extension)
        enabled: true
    },

    // --- 2. LAND LEVEL (Sachsen) ---
    {
        id: 'sachsen_ukraine_portal',
        source_name: 'Sachsen Ukraine Portal',
        url: 'https://www.ukrainehilfe.sachsen.de/',
        scope: 'LAND',
        geo: { country: 'DE', land: 'Sachsen' },
        parser: 'sachsen_portal',
        baseScore: 15,
        enabled: true
    },
    {
        id: 'lds_asyl',
        source_name: 'Landesdirektion Sachsen',
        url: 'https://www.lds.sachsen.de/asyl/?ID=23075&art_param=917',
        scope: 'LAND',
        geo: { country: 'DE', land: 'Sachsen' },
        parser: 'generic_html',
        baseScore: 5,
        enabled: true
    },
    {
        id: 'smk_blog',
        source_name: 'SMK Blog (Haridus)',
        url: 'https://www.bildung.sachsen.de/blog/index.php/tag/daz/',
        scope: 'LAND',
        geo: { country: 'DE', land: 'Sachsen' },
        parser: 'generic_html',
        baseScore: 5,
        enabled: true
    },

    // --- 3. CITY LEVEL (Leipzig) ---
    {
        id: 'jobcenter_leipzig',
        source_name: 'Jobcenter Leipzig',
        url: 'https://jobcenter-leipzig.de/aktuelles/',
        scope: 'CITY',
        geo: { country: 'DE', land: 'Sachsen', city: 'Leipzig' },
        parser: 'generic_html',
        parser_config: {
            selector: 'div.news-item, article, .entry'
        },
        baseScore: 20, // Local JC is critical
        enabled: true
    },
    {
        id: 'leipzig_ukraine_hilfe',
        source_name: 'Stadt Leipzig (Ukraine)',
        url: 'https://www.leipzig.de/leben-in-leipzig/soziales/migration-und-integration/ukraine-hilfe',
        scope: 'CITY',
        geo: { country: 'DE', land: 'Sachsen', city: 'Leipzig' },
        parser: 'leipzig_city',
        baseScore: 15,
        enabled: true
    },
    {
        id: 'leipzig_auslaenderbehoerde',
        source_name: 'Stadt Leipzig (ABH)',
        url: 'https://www.leipzig.de/service-portal/dienststelle/auslaenderbehoerde-327',
        scope: 'CITY',
        geo: { country: 'DE', land: 'Sachsen', city: 'Leipzig' },
        parser: 'generic_html',
        baseScore: 10,
        enabled: true
    },
    {
        id: 'lvb_changes',
        source_name: 'LVB (Transport)',
        url: 'https://www.l.de/verkehrsbetriebe/fahren/aenderungen-im-linienverkehr/',
        scope: 'CITY',
        geo: { country: 'DE', land: 'Sachsen', city: 'Leipzig' },
        parser: 'generic_html',
        baseScore: 5,
        enabled: true
    }
];
