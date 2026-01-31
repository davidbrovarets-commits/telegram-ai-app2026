/**
 * CITY SOURCE PACKAGE TEMPLATE v3 - VERIFIED URLs
 * 
 * Updated with verified URL patterns for German cities.
 * Uses actual website structures discovered through testing.
 */

import type { SourceConfig } from './config';
import { generateCityNewsHub } from './news-hub-template';

export function createCityPackage(
    cityName: string,
    cityCode: string,
    landName: string,
    urls: {
        main: string;       // Main city page (usually works)
        ukraineHelp?: string; // Ukraine help page if verified
    }
): SourceConfig[] {
    const code = cityCode.toLowerCase();

    // Generate NEWS_HUB source for this city (always works via Google)
    const newsHubSource = generateCityNewsHub({
        name: cityName,
        code: cityCode,
        land: landName,
        package_id: `city_${code}`
    });

    const sources: SourceConfig[] = [
        // SOURCE 1: MAIN CITY PAGE (usually reliable)
        {
            source_id: `city_${code}_main`,
            source_name: `${cityName} — Stadtportal`,
            scope: 'CITY',
            geo: { country: 'DE', land: landName, city: cityName },
            base_url: urls.main,
            default_topics: ['city_services', 'migration', 'integration'],
            default_priority: 'MEDIUM',
            default_actions: ['info'],
            dedupe_group: `city_${code}_main`,
            parser_notes: 'Main city portal - general news section.',
            enabled: true
        },

        // SOURCE 2: NEWS_HUB (Google search - always works)
        newsHubSource as SourceConfig
    ];

    // Only add Ukraine help if URL is verified
    if (urls.ukraineHelp) {
        sources.push({
            source_id: `city_${code}_ukraine`,
            source_name: `${cityName} — Ukraine Hilfe`,
            scope: 'CITY',
            geo: { country: 'DE', land: landName, city: cityName },
            base_url: urls.ukraineHelp,
            default_topics: ['ukraine', 'migration', 'help'],
            default_priority: 'HIGH',
            default_actions: ['procedure_change', 'info'],
            dedupe_group: `city_${code}_ukraine`,
            parser_notes: 'City Ukraine help portal.',
            enabled: true
        });
    }

    return sources;
}

// ============================================
// VERIFIED CITY PACKAGES
// ============================================

// LEIPZIG (Sachsen) - VERIFIED
export const LEIPZIG_PACKAGE = createCityPackage(
    'Leipzig', 'LEJ', 'Sachsen',
    {
        main: 'https://www.leipzig.de/news/',
        ukraineHelp: 'https://www.leipzig.de/buergerservice-und-verwaltung/unsere-stadt/ukraine/'
    }
);

// MÜNCHEN (Bayern) - VERIFIED
export const MUENCHEN_PACKAGE = createCityPackage(
    'München', 'MUC', 'Bayern',
    {
        main: 'https://stadt.muenchen.de/infos/aktuell.html',
        ukraineHelp: 'https://stadt.muenchen.de/infos/hilfe-fuer-die-ukraine.html'
    }
);

// KÖLN (NRW) - VERIFIED
export const KOELN_PACKAGE = createCityPackage(
    'Köln', 'CGN', 'Nordrhein-Westfalen',
    {
        main: 'https://www.stadt-koeln.de/politik-und-verwaltung/presse/mitteilungen',
        ukraineHelp: 'https://www.stadt-koeln.de/leben-in-koeln/soziales/hilfe-ukraine'
    }
);

// FRANKFURT (Hessen) - VERIFIED
export const FRANKFURT_PACKAGE = createCityPackage(
    'Frankfurt am Main', 'FRA', 'Hessen',
    {
        main: 'https://frankfurt.de/aktuelle-meldungen',
        ukraineHelp: 'https://frankfurt.de/themen/soziales-und-gesellschaft/ukraine-krieg'
    }
);

// STUTTGART (BW) - VERIFIED
export const STUTTGART_PACKAGE = createCityPackage(
    'Stuttgart', 'STR', 'Baden-Württemberg',
    {
        main: 'https://www.stuttgart.de/service/aktuelle-meldungen/',
        ukraineHelp: 'https://www.stuttgart.de/leben/gesellschaft-und-soziales/fluechtlinge/ukraine.php'
    }
);

// DÜSSELDORF (NRW) - VERIFIED
export const DUESSELDORF_PACKAGE = createCityPackage(
    'Düsseldorf', 'DUS', 'Nordrhein-Westfalen',
    {
        main: 'https://www.duesseldorf.de/medienportal/pressedienst',
        ukraineHelp: 'https://www.duesseldorf.de/ukraine/'
    }
);

// DORTMUND (NRW) - VERIFIED
export const DORTMUND_PACKAGE = createCityPackage(
    'Dortmund', 'DTM', 'Nordrhein-Westfalen',
    {
        main: 'https://www.dortmund.de/de/leben_in_dortmund/nachrichtenportal/',
        ukraineHelp: 'https://www.dortmund.de/ukraine/'
    }
);

// ESSEN (NRW) - VERIFIED
export const ESSEN_PACKAGE = createCityPackage(
    'Essen', 'ESS', 'Nordrhein-Westfalen',
    {
        main: 'https://www.essen.de/meldungen/pressemeldungen/',
        ukraineHelp: 'https://www.essen.de/ukraine/'
    }
);

// HANNOVER (Niedersachsen) - VERIFIED
export const HANNOVER_PACKAGE = createCityPackage(
    'Hannover', 'HAJ', 'Niedersachsen',
    {
        main: 'https://www.hannover.de/Service/Presse-Medien/Hannover.de/Aktuelles',
        ukraineHelp: 'https://www.hannover.de/Leben-in-der-Region-Hannover/Soziales/Fl%C3%BCchtlinge-in-Hannover/Ukraine'
    }
);

// NÜRNBERG (Bayern) - VERIFIED
export const NUERNBERG_PACKAGE = createCityPackage(
    'Nürnberg', 'NUE', 'Bayern',
    {
        main: 'https://www.nuernberg.de/internet/stadtportal/aktuell_nu.html',
        ukraineHelp: 'https://www.nuernberg.de/internet/integration/ukraine.html'
    }
);

// DRESDEN (Sachsen) - VERIFIED
export const DRESDEN_PACKAGE = createCityPackage(
    'Dresden', 'DRS', 'Sachsen',
    {
        main: 'https://www.dresden.de/de/rathaus/aktuelles/pressemitteilungen.php',
        ukraineHelp: 'https://www.dresden.de/de/leben/gesellschaft/migration/ukraine.php'
    }
);

// DUISBURG (NRW) - VERIFIED
export const DUISBURG_PACKAGE = createCityPackage(
    'Duisburg', 'DUI', 'Nordrhein-Westfalen',
    {
        main: 'https://www.duisburg.de/guiapplications/newsdesk/publications/pressemitteilungen/',
        ukraineHelp: 'https://www.duisburg.de/ukraine/'
    }
);

// BOCHUM (NRW) - VERIFIED
export const BOCHUM_PACKAGE = createCityPackage(
    'Bochum', 'BOC', 'Nordrhein-Westfalen',
    {
        main: 'https://www.bochum.de/Pressestelle/Meldungen',
        ukraineHelp: 'https://www.bochum.de/Ukraine-Hilfe'
    }
);

// WUPPERTAL (NRW) - VERIFIED
export const WUPPERTAL_PACKAGE = createCityPackage(
    'Wuppertal', 'WUP', 'Nordrhein-Westfalen',
    {
        main: 'https://www.wuppertal.de/microsite/stk_presse/medienmitteilungen/',
        ukraineHelp: 'https://www.wuppertal.de/ukraine/'
    }
);

// BIELEFELD (NRW) - VERIFIED
export const BIELEFELD_PACKAGE = createCityPackage(
    'Bielefeld', 'BIE', 'Nordrhein-Westfalen',
    {
        main: 'https://www.bielefeld.de/aktuelles',
        ukraineHelp: 'https://www.bielefeld.de/ukraine'
    }
);

// BONN (NRW) - VERIFIED
export const BONN_PACKAGE = createCityPackage(
    'Bonn', 'BON', 'Nordrhein-Westfalen',
    {
        main: 'https://www.bonn.de/bonn-aktuell/pressemitteilungen.php',
        ukraineHelp: 'https://www.bonn.de/ukraine'
    }
);

// MÜNSTER (NRW) - VERIFIED
export const MUENSTER_PACKAGE = createCityPackage(
    'Münster', 'MS', 'Nordrhein-Westfalen',
    {
        main: 'https://www.stadt-muenster.de/aktuelles',
        ukraineHelp: 'https://www.stadt-muenster.de/ukraine'
    }
);

// KARLSRUHE (BW) - VERIFIED
export const KARLSRUHE_PACKAGE = createCityPackage(
    'Karlsruhe', 'KAE', 'Baden-Württemberg',
    {
        main: 'https://www.karlsruhe.de/b4/aktuell',
        ukraineHelp: 'https://www.karlsruhe.de/ukraine'
    }
);

// MANNHEIM (BW) - VERIFIED
export const MANNHEIM_PACKAGE = createCityPackage(
    'Mannheim', 'MA', 'Baden-Württemberg',
    {
        main: 'https://www.mannheim.de/de/presse',
        ukraineHelp: 'https://www.mannheim.de/de/ukraine'
    }
);

// AUGSBURG (Bayern) - VERIFIED
export const AUGSBURG_PACKAGE = createCityPackage(
    'Augsburg', 'AGB', 'Bayern',
    {
        main: 'https://www.augsburg.de/aktuelles-aus-der-stadt',
        ukraineHelp: 'https://www.augsburg.de/ukraine'
    }
);
