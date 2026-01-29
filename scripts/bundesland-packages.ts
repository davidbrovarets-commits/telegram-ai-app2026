/**
 * BUNDESLAND SOURCE PACKAGE TEMPLATE
 * 
 * Use this template to add a new Bundesland to the geo-scoped news system.
 * Fill in the placeholders and add to config.ts SOURCES array.
 * 
 * MANDATORY FIELDS:
 * - BUNDESLAND_NAME: Official name (e.g., "Nordrhein-Westfalen")
 * - BUNDESLAND_CODE: Short code (e.g., "nrw")
 * - UKRAINE_PORTAL_URL: Official state portal for refugees
 * - LAND_ADMINISTRATION_URL: Landesdirektion/Landesamt page
 * - EDUCATION_PORTAL_URL: DaZ/school integration portal
 */

import type { SourceConfig } from './config';

// ============================================
// TEMPLATE FUNCTION
// ============================================

export function createBundeslandPackage(
    bundeslandName: string,
    bundeslandCode: string,
    urls: {
        ukrainePortal: string;
        landAdministration: string;
        education: string;
        integration?: string; // Optional
    }
): SourceConfig[] {
    const sources: SourceConfig[] = [
        // SOURCE 1: Official Ukraine/Refugee Portal
        {
            source_id: `land_${bundeslandCode}_ukraine_portal`,
            source_name: `${bundeslandName} — Ukraine Portal`,
            scope: 'LAND',
            geo: { country: 'DE', land: bundeslandName },
            base_url: urls.ukrainePortal,
            default_topics: ['status', 'documents', 'housing', 'benefits', 'work', 'children', 'health'],
            default_priority: 'HIGH',
            default_actions: ['procedure_change', 'info'],
            dedupe_group: `land_${bundeslandCode}_main`,
            parser_notes: 'Main official portal for refugees/Ukrainians. Track changes in rules and procedures.',
            enabled: true
        },

        // SOURCE 2: Landesdirektion / Landesamt
        {
            source_id: `land_${bundeslandCode}_administration`,
            source_name: `${bundeslandName} — Landesdirektion`,
            scope: 'LAND',
            geo: { country: 'DE', land: bundeslandName },
            base_url: urls.landAdministration,
            default_topics: ['status', 'procedures', 'accommodation', 'distribution'],
            default_priority: 'HIGH',
            default_actions: ['procedure_change', 'document_required', 'info'],
            dedupe_group: `land_${bundeslandCode}_admin`,
            parser_notes: 'Administrative body issuing procedures and instructions.',
            enabled: true
        },

        // SOURCE 3: Education / DaZ
        {
            source_id: `land_${bundeslandCode}_education`,
            source_name: `${bundeslandName} — Bildung/DaZ`,
            scope: 'LAND',
            geo: { country: 'DE', land: bundeslandName },
            base_url: urls.education,
            default_topics: ['children', 'school', 'language_integration'],
            default_priority: 'MEDIUM',
            default_actions: ['info'],
            dedupe_group: `land_${bundeslandCode}_education`,
            parser_notes: 'Only practical education-related changes affecting access or rules.',
            enabled: true
        }
    ];

    // OPTIONAL SOURCE 4: Integration Programs
    if (urls.integration) {
        sources.push({
            source_id: `land_${bundeslandCode}_integration`,
            source_name: `${bundeslandName} — Integration`,
            scope: 'LAND',
            geo: { country: 'DE', land: bundeslandName },
            base_url: urls.integration,
            default_topics: ['integration', 'programs', 'consultation'],
            default_priority: 'MEDIUM',
            default_actions: ['info'],
            dedupe_group: `land_${bundeslandCode}_integration`,
            parser_notes: 'State-funded integration or support programs with practical relevance.',
            enabled: true
        });
    }

    return sources;
}

// ============================================
// EXAMPLE PACKAGES (uncomment to use)
// ============================================

// SACHSEN (already in main config)
export const SACHSEN_PACKAGE = createBundeslandPackage(
    'Sachsen',
    'sachsen',
    {
        ukrainePortal: 'https://www.ukrainehilfe.sachsen.de/',
        landAdministration: 'https://www.lds.sachsen.de/asyl/?ID=23075&art_param=917',
        education: 'https://www.bildung.sachsen.de/blog/index.php/tag/daz/'
    }
);

// NORDRHEIN-WESTFALEN (Official v1.0)
export const NRW_PACKAGE = createBundeslandPackage(
    'Nordrhein-Westfalen',
    'nrw',
    {
        ukrainePortal: 'https://www.mkjfgfi.nrw/ukraine',
        landAdministration: 'https://www.bra.nrw.de/integration-migration/fluechtlinge-nrw',
        education: 'https://www.schulministerium.nrw/umgang-mit-den-auswirkungen-des-russland-ukraine-krieges',
        integration: 'https://www.mkjfgfi.nrw/kommunale-integrationszentren'
    }
);

// BAYERN (Official v1.0)
export const BAYERN_PACKAGE = createBundeslandPackage(
    'Bayern',
    'bayern',
    {
        ukrainePortal: 'https://www.stmi.bayern.de/mui/ukrainehilfe/',
        landAdministration: 'https://www.regierung.oberbayern.bayern.de/aufgaben/37172/37193/ukraine-hilfe',
        education: 'https://www.km.bayern.de/ukraine.html',
        integration: 'https://www.integrationsbeauftragter.bayern.de/ukraine/'
    }
);

// BERLIN (Special Case: City == Land)
export const BERLIN_PACKAGE = createBundeslandPackage(
    'Berlin',
    'BE',
    {
        ukrainePortal: 'https://www.berlin.de/ukraine/',
        landAdministration: 'https://www.berlin.de/laf/',
        education: 'https://www.berlin.de/sen/bjf/service/ukraine/',
        integration: 'https://www.berlin.de/sen/integration/ukraine/'
    }
);

// BRANDENBURG (Official v1.0)
export const BRANDENBURG_PACKAGE = createBundeslandPackage(
    'Brandenburg',
    'BB',
    {
        ukrainePortal: 'https://www.brandenburg.de/ukraine',
        landAdministration: 'https://msgiv.brandenburg.de/msgiv/de/themen/migration-und-integration/flucht-aus-der-ukraine/',
        education: 'https://mbjs.brandenburg.de/mbjs/de/bildung/schule/ukraine/',
        integration: 'https://www.mik.brandenburg.de/mik/de/migration/'
    }
);

// BREMEN (Special Case: City == Land)
export const BREMEN_PACKAGE = createBundeslandPackage(
    'Bremen',
    'HB',
    {
        ukrainePortal: 'https://www.bremen.de/leben-in-bremen/ukraine',
        landAdministration: 'https://www.inneres.bremen.de/inneres-und-sport/migration-13164',
        education: 'https://www.bildung.bremen.de/ukraine-173463',
        integration: 'https://www.soziales.bremen.de/integration-17802'
    }
);

// HAMBURG (Special Case: City == Land)
export const HAMBURG_PACKAGE = createBundeslandPackage(
    'Hamburg',
    'HH',
    {
        ukrainePortal: 'https://www.hamburg.de/ukraine/',
        landAdministration: 'https://www.hamburg.de/behorde-fuer-inneres-und-sport/',
        education: 'https://www.hamburg.de/bsb/ukraine/',
        integration: 'https://www.hamburg.de/flucht-und-integration/'
    }
);

// HESSEN (Official v1.0)
export const HESSEN_PACKAGE = createBundeslandPackage(
    'Hessen',
    'HE',
    {
        ukrainePortal: 'https://innen.hessen.de/fluechtlinge-aus-der-ukraine',
        landAdministration: 'https://rp-giessen.hessen.de/flucht-und-asyl/ukraine',
        education: 'https://kultusministerium.hessen.de/unterricht/ukraine',
        integration: 'https://integrationskompass.hessen.de/'
    }
);

// BADEN-WÜRTTEMBERG (Official v1.0)
export const BW_PACKAGE = createBundeslandPackage(
    'Baden-Württemberg',
    'BW',
    {
        ukrainePortal: 'https://www.baden-wuerttemberg.de/de/service/ukraine/',
        landAdministration: 'https://rp.baden-wuerttemberg.de/themen/migration/',
        education: 'https://km-bw.de/,Lde/Startseite/Schule/Ukraine',
        integration: 'https://www.integrationsministerium-bw.de/de/ankommen/ukraine/'
    }
);

