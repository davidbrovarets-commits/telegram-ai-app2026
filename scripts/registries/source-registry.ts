
export const SOURCE_REGISTRY = [
    {
        source_id: 'tagesschau_rss',
        name: 'Tagesschau',
        base_url: 'https://www.tagesschau.de/xml/rss2/',
        language: 'de',
        trust_level: 10,
        ingestion_method: 'rss',
        default_priority: 'HIGH'
    },
    {
        source_id: 'dw_rss',
        name: 'DW Deutsch',
        base_url: 'https://rss.dw.com/xml/rss/de-all',
        language: 'de',
        trust_level: 9,
        ingestion_method: 'rss',
        default_priority: 'MEDIUM'
    },
    {
        source_id: 'spiegel_rss',
        name: 'Der Spiegel',
        base_url: 'https://www.spiegel.de/schlagzeilen/tops/index.rss',
        language: 'de',
        trust_level: 8,
        ingestion_method: 'rss',
        default_priority: 'MEDIUM'
    }
];
