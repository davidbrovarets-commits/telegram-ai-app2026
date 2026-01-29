export type NewsSource = {
    region: 'Brandenburg' | 'Sachsen' | 'all';
    url: string;
    parser: 'jc_brandenburg' | 'arbeitsagentur' | 'germany4ukraine' | 'bamf' | 'handbook_germany' | 'dw_html';
    category: 'local' | 'legal' | 'integration' | 'news';
    type?: 'html' | 'rss';
};

export const SOURCES: NewsSource[] = [
    // --- REGIONAALNE ---
    {
        region: 'Brandenburg',
        url: 'https://www.jc-brandenburg.de/aktuelles-presse/',
        parser: 'jc_brandenburg',
        category: 'local',
        type: 'html'
    },
    {
        region: 'Sachsen',
        url: 'https://www.arbeitsagentur.de/vor-ort/rd-sachsen/presse/presseinformationen',
        parser: 'arbeitsagentur',
        category: 'local',
        type: 'html'
    },

    // --- AMETLIK ---
    {
        region: 'all',
        url: 'https://www.bamf.de/DE/Presse/Pressemitteilungen/pressemitteilungen_node.html',
        parser: 'bamf',
        category: 'legal',
        type: 'html'
    },

    // --- MEEDIA ---
    {
        region: 'all',
        url: 'https://www.dw.com/uk/holovna/s-9874',
        parser: 'dw_html',
        category: 'news',
        type: 'html'
    }
];
