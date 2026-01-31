/**
 * BUNDESLAND SOURCE PACKAGE TEMPLATE v2 - VERIFIED URLs
 * 
 * Updated with verified URL patterns for German federal states.
 */

import type { SourceConfig } from './config';

export function createBundeslandPackage(
    bundeslandName: string,
    bundeslandCode: string,
    urls: {
        main: string;           // Main state portal
        ukrainePortal?: string; // Ukraine-specific page if exists
        integration?: string;   // Integration page if exists
    }
): SourceConfig[] {
    const sources: SourceConfig[] = [
        // SOURCE 1: Main State Portal (always reliable)
        {
            source_id: `land_${bundeslandCode}_main`,
            source_name: `${bundeslandName} — Landesportal`,
            scope: 'LAND',
            geo: { country: 'DE', land: bundeslandName },
            base_url: urls.main,
            default_topics: ['policy', 'migration', 'news'],
            default_priority: 'MEDIUM',
            default_actions: ['info'],
            dedupe_group: `land_${bundeslandCode}_main`,
            parser_notes: 'Main state news portal.',
            enabled: true
        }
    ];

    // Add Ukraine portal if verified
    if (urls.ukrainePortal) {
        sources.push({
            source_id: `land_${bundeslandCode}_ukraine`,
            source_name: `${bundeslandName} — Ukraine Portal`,
            scope: 'LAND',
            geo: { country: 'DE', land: bundeslandName },
            base_url: urls.ukrainePortal,
            default_topics: ['ukraine', 'refugees', 'help'],
            default_priority: 'HIGH',
            default_actions: ['procedure_change', 'info'],
            dedupe_group: `land_${bundeslandCode}_ukraine`,
            parser_notes: 'Official Ukraine/refugee portal.',
            enabled: true
        });
    }

    // Add integration portal if verified
    if (urls.integration) {
        sources.push({
            source_id: `land_${bundeslandCode}_integration`,
            source_name: `${bundeslandName} — Integration`,
            scope: 'LAND',
            geo: { country: 'DE', land: bundeslandName },
            base_url: urls.integration,
            default_topics: ['integration', 'migration'],
            default_priority: 'MEDIUM',
            default_actions: ['info'],
            dedupe_group: `land_${bundeslandCode}_integration`,
            parser_notes: 'State integration programs.',
            enabled: true
        });
    }

    return sources;
}

// ============================================
// VERIFIED BUNDESLAND PACKAGES
// ============================================

// SACHSEN (verified)
export const SACHSEN_PACKAGE = createBundeslandPackage(
    'Sachsen', 'SN',
    {
        main: 'https://www.medienservice.sachsen.de/',
        ukrainePortal: 'https://www.ukrainehilfe.sachsen.de/',
        integration: 'https://www.willkommen.sachsen.de/'
    }
);

// NORDRHEIN-WESTFALEN (verified)
export const NRW_PACKAGE = createBundeslandPackage(
    'Nordrhein-Westfalen', 'NW',
    {
        main: 'https://www.land.nrw/pressemitteilungen',
        ukrainePortal: 'https://www.mkjfgfi.nrw/ukraine',
        integration: 'https://www.mkjfgfi.nrw/integration'
    }
);

// BAYERN (verified)
export const BAYERN_PACKAGE = createBundeslandPackage(
    'Bayern', 'BY',
    {
        main: 'https://www.bayern.de/politik/pressemitteilungen/',
        ukrainePortal: 'https://www.stmi.bayern.de/mui/ukrainehilfe/',
        integration: 'https://www.integrationsbeauftragter.bayern.de/'
    }
);

// BERLIN (City-State, verified)
export const BERLIN_PACKAGE = createBundeslandPackage(
    'Berlin', 'BE',
    {
        main: 'https://www.berlin.de/aktuelles/pressemitteilungen/',
        ukrainePortal: 'https://www.berlin.de/ukraine/',
        integration: 'https://www.berlin.de/sen/integration/'
    }
);

// BRANDENBURG (verified)
export const BRANDENBURG_PACKAGE = createBundeslandPackage(
    'Brandenburg', 'BB',
    {
        main: 'https://www.brandenburg.de/cms/list.php/land_bb_presse',
        ukrainePortal: 'https://msgiv.brandenburg.de/msgiv/de/themen/migration-und-integration/',
        integration: 'https://www.integrationsbeauftragte.brandenburg.de/'
    }
);

// BREMEN (City-State, verified)
export const BREMEN_PACKAGE = createBundeslandPackage(
    'Bremen', 'HB',
    {
        main: 'https://www.bremen.de/presse',
        ukrainePortal: 'https://www.bremen.de/leben-in-bremen/ukraine',
        integration: 'https://www.soziales.bremen.de/integration'
    }
);

// HAMBURG (City-State, verified)
export const HAMBURG_PACKAGE = createBundeslandPackage(
    'Hamburg', 'HH',
    {
        main: 'https://www.hamburg.de/pressemeldungen/',
        ukrainePortal: 'https://www.hamburg.de/ukraine/',
        integration: 'https://www.hamburg.de/integration/'
    }
);

// MECKLENBURG-VORPOMMERN (verified)
export const MV_PACKAGE = createBundeslandPackage(
    'Mecklenburg-Vorpommern', 'MV',
    {
        main: 'https://www.regierung-mv.de/Landesregierung/presse/',
        ukrainePortal: 'https://www.regierung-mv.de/Landesregierung/im/Ukraine/',
        integration: 'https://www.regierung-mv.de/Landesregierung/sm/Themen/Integration/'
    }
);

// NIEDERSACHSEN (verified)
export const NI_PACKAGE = createBundeslandPackage(
    'Niedersachsen', 'NI',
    {
        main: 'https://www.stk.niedersachsen.de/presse/',
        ukrainePortal: 'https://www.niedersachsen.de/Ukraine',
        integration: 'https://www.migrationsportal.de/'
    }
);

// RHEINLAND-PFALZ (verified)
export const RP_PACKAGE = createBundeslandPackage(
    'Rheinland-Pfalz', 'RP',
    {
        main: 'https://www.rlp.de/de/aktuelles/presse/',
        ukrainePortal: 'https://ukraine.rlp.de/',
        integration: 'https://integrationsportal.rlp.de/'
    }
);

// SAARLAND (verified)
export const SL_PACKAGE = createBundeslandPackage(
    'Saarland', 'SL',
    {
        main: 'https://www.saarland.de/DE/portale/presse/',
        ukrainePortal: 'https://www.saarland.de/ukraine',
        integration: 'https://www.saarland.de/DE/portale/integration/'
    }
);

// SACHSEN-ANHALT (verified)
export const ST_PACKAGE = createBundeslandPackage(
    'Sachsen-Anhalt', 'ST',
    {
        main: 'https://www.sachsen-anhalt.de/bs/presse/',
        ukrainePortal: 'https://www.sachsen-anhalt.de/ukraine',
        integration: 'https://ms.sachsen-anhalt.de/themen/integration/'
    }
);

// SCHLESWIG-HOLSTEIN (verified)
export const SH_PACKAGE = createBundeslandPackage(
    'Schleswig-Holstein', 'SH',
    {
        main: 'https://www.schleswig-holstein.de/DE/landesregierung/presse/',
        ukrainePortal: 'https://www.schleswig-holstein.de/DE/landesregierung/themen/ukraine/',
        integration: 'https://www.schleswig-holstein.de/DE/landesregierung/themen/integration/'
    }
);

// THÜRINGEN (verified)
export const TH_PACKAGE = createBundeslandPackage(
    'Thüringen', 'TH',
    {
        main: 'https://www.thueringen.de/th2/presse/',
        ukrainePortal: 'https://www.thueringen.de/ukraine',
        integration: 'https://www.integration.thueringen.de/'
    }
);

// HESSEN (verified)
export const HESSEN_PACKAGE = createBundeslandPackage(
    'Hessen', 'HE',
    {
        main: 'https://www.hessen.de/presse/',
        ukrainePortal: 'https://innen.hessen.de/fluechtlinge-aus-der-ukraine',
        integration: 'https://integrationskompass.hessen.de/'
    }
);

// BADEN-WÜRTTEMBERG (verified)
export const BW_PACKAGE = createBundeslandPackage(
    'Baden-Württemberg', 'BW',
    {
        main: 'https://www.baden-wuerttemberg.de/de/service/presse/',
        ukrainePortal: 'https://www.baden-wuerttemberg.de/de/service/ukraine/',
        integration: 'https://www.integrationsministerium-bw.de/'
    }
);
