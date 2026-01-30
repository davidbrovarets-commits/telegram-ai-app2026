/**
 * CITY SOURCE PACKAGE TEMPLATE v1
 * 
 * Helper to configure CITY-level source packages.
 * Enforces strict structure: Jobcenter, Immigration, Help, Appointments.
 */

import type { SourceConfig } from './config';

export function createCityPackage(
    cityName: string,
    cityCode: string, // e.g. "leipzig" or "muenchen"
    landName: string, // e.g. "Sachsen"
    urls: {
        jobcenter: string;
        immigration: string;
        ukraineHelp: string;
        appointments: string;
    }
): SourceConfig[] {
    const code = cityCode.toLowerCase();

    return [
        // SOURCE 1: JOBCENTER (CITY)
        {
            source_id: `city_${code}_jobcenter`,
            source_name: `Jobcenter ${cityName}`,
            scope: 'CITY',
            geo: { country: 'DE', land: landName, city: cityName },
            base_url: urls.jobcenter,
            default_topics: ['jobcenter', 'benefits', 'documents', 'appointments'],
            default_priority: 'HIGH',
            default_actions: ['deadline', 'document_required', 'appointment'],
            dedupe_group: `city_${code}_jobcenter`,
            parser_notes: 'Deadlines, document requests, appointments, payment issues. Primary HIGH-push source.',
            enabled: true
        },

        // SOURCE 2: AUSLÄNDERBEHÖRDE (CITY)
        {
            source_id: `city_${code}_immigration`,
            source_name: `${cityName} — Ausländerbehörde`,
            scope: 'CITY',
            geo: { country: 'DE', land: landName, city: cityName },
            base_url: urls.immigration,
            default_topics: ['status', 'documents', 'appointments'],
            default_priority: 'HIGH',
            default_actions: ['appointment', 'document_required', 'status_risk'],
            dedupe_group: `city_${code}_status`,
            parser_notes: 'Residence permits, appointments, document requirements, status risk.',
            enabled: true
        },

        // SOURCE 3: CITY UKRAINE / MIGRATION HELP
        {
            source_id: `city_${code}_ukraine_help`,
            source_name: `${cityName} — Ukraine Hilfe`,
            scope: 'CITY',
            geo: { country: 'DE', land: landName, city: cityName },
            base_url: urls.ukraineHelp,
            default_topics: ['status', 'first_steps', 'help', 'housing'],
            default_priority: 'HIGH',
            default_actions: ['procedure_change', 'info'],
            dedupe_group: `city_${code}_help`,
            parser_notes: 'Official city guidance for Ukrainians. Only practical changes.',
            enabled: true
        },

        // SOURCE 4: APPOINTMENTS / TERMINE
        {
            source_id: `city_${code}_appointments`,
            source_name: `${cityName} — Online Termine`,
            scope: 'CITY',
            geo: { country: 'DE', land: landName, city: cityName },
            base_url: urls.appointments,
            default_topics: ['appointments'],
            default_priority: 'HIGH',
            default_actions: ['appointment'],
            dedupe_group: `city_${code}_termine`,
            parser_notes: 'Appointment availability changes. HIGH push when slots open or rules change.',
            enabled: true
        }
    ];
}

// ============================================
// CITY PACKAGES
// ============================================

// LEIPZIG (Sachsen)
export const LEIPZIG_PACKAGE = createCityPackage(
    'Leipzig',
    'LEJ',
    'Sachsen',
    {
        jobcenter: 'https://jobcenter-leipzig.de/aktuelles/',
        immigration: 'https://www.leipzig.de/service-portal/dienststelle/auslaenderbehoerde-327',
        ukraineHelp: 'https://www.leipzig.de/leben-in-leipzig/soziales/migration-und-integration/ukraine-hilfe',
        appointments: 'https://www.leipzig.de/service-portal/aemtertermine-online'
    }
);

// MÜNCHEN (Bayern)
export const MUENCHEN_PACKAGE = createCityPackage(
    'München',
    'MUC',
    'Bayern',
    {
        jobcenter: 'https://www.arbeitsagentur.de/vor-ort/muenchen/jobcenter',
        immigration: 'https://stadt.muenchen.de/infos/auslaenderbehoerde.html',
        ukraineHelp: 'https://stadt.muenchen.de/infos/ukraine-hilfe.html',
        appointments: 'https://terminvereinbarung.muenchen.de/'
    }
);

// KÖLN (Nordrhein-Westfalen)
export const KOELN_PACKAGE = createCityPackage(
    'Köln',
    'CGN',
    'Nordrhein-Westfalen',
    {
        jobcenter: 'https://www.jobcenter-koeln.de/',
        immigration: 'https://www.stadt-koeln.de/service/auslaenderangelegenheiten',
        ukraineHelp: 'https://www.stadt-koeln.de/artikel/70238/',
        appointments: 'https://termine.stadt-koeln.de/'
    }
);

// FRANKFURT AM MAIN (Hessen)
export const FRANKFURT_PACKAGE = createCityPackage(
    'Frankfurt am Main',
    'FRA',
    'Hessen',
    {
        jobcenter: 'https://www.jobcenter-frankfurt.de/',
        immigration: 'https://frankfurt.de/auslaenderbehoerde',
        ukraineHelp: 'https://frankfurt.de/ukraine-hilfe',
        appointments: 'https://frankfurt.de/service-und-rathaus/verwaltung/aemter-und-institutionen/terminvereinbarung'
    }
);

// STUTTGART (Baden-Württemberg)
export const STUTTGART_PACKAGE = createCityPackage(
    'Stuttgart',
    'STR',
    'Baden-Württemberg',
    {
        jobcenter: 'https://www.jobcenter-stuttgart.de/',
        immigration: 'https://www.stuttgart.de/auslaenderbehoerde',
        ukraineHelp: 'https://www.stuttgart.de/ukraine',
        appointments: 'https://www.stuttgart.de/service/terminvereinbarung'
    }
);

// DÜSSELDORF (Nordrhein-Westfalen)
export const DUESSELDORF_PACKAGE = createCityPackage(
    'Düsseldorf',
    'DUS',
    'Nordrhein-Westfalen',
    {
        jobcenter: 'https://www.jobcenter-duesseldorf.de/',
        immigration: 'https://www.duesseldorf.de/auslaenderamt',
        ukraineHelp: 'https://www.duesseldorf.de/ukraine',
        appointments: 'https://termine.duesseldorf.de/'
    }
);

// DORTMUND (Nordrhein-Westfalen)
export const DORTMUND_PACKAGE = createCityPackage(
    'Dortmund',
    'DTM',
    'Nordrhein-Westfalen',
    {
        jobcenter: 'https://www.jobcenter-dortmund.de/',
        immigration: 'https://www.dortmund.de/auslaenderbehoerde',
        ukraineHelp: 'https://www.dortmund.de/ukraine',
        appointments: 'https://termine.dortmund.de/'
    }
);

// ESSEN (Nordrhein-Westfalen)
export const ESSEN_PACKAGE = createCityPackage(
    'Essen',
    'ESS',
    'Nordrhein-Westfalen',
    {
        jobcenter: 'https://www.jobcenter-essen.de/',
        immigration: 'https://www.essen.de/auslaenderbehoerde',
        ukraineHelp: 'https://www.essen.de/ukraine',
        appointments: 'https://termine.essen.de/'
    }
);

// HANNOVER (Niedersachsen)
export const HANNOVER_PACKAGE = createCityPackage(
    'Hannover',
    'HAJ',
    'Niedersachsen',
    {
        jobcenter: 'https://www.jobcenter-hannover.de/',
        immigration: 'https://www.hannover.de/Auslaenderbehoerde',
        ukraineHelp: 'https://www.hannover.de/Ukraine',
        appointments: 'https://termin.hannover-stadt.de/'
    }
);

// NÜRNBERG (Bayern)
export const NUERNBERG_PACKAGE = createCityPackage(
    'Nürnberg',
    'NUE',
    'Bayern',
    {
        jobcenter: 'https://www.jobcenter-nuernberg.de/',
        immigration: 'https://www.nuernberg.de/internet/auslaenderbehoerde/',
        ukraineHelp: 'https://www.nuernberg.de/internet/integration/ukraine.html',
        appointments: 'https://termin.nuernberg.de/'
    }
);

// DRESDEN (Sachsen)
export const DRESDEN_PACKAGE = createCityPackage(
    'Dresden',
    'DRS',
    'Sachsen',
    {
        jobcenter: 'https://www.jobcenter-dresden.de/',
        immigration: 'https://www.dresden.de/auslaenderbehoerde',
        ukraineHelp: 'https://www.dresden.de/ukraine',
        appointments: 'https://termine.dresden.de/'
    }
);

// DUISBURG (Nordrhein-Westfalen)
export const DUISBURG_PACKAGE = createCityPackage(
    'Duisburg',
    'DUI',
    'Nordrhein-Westfalen',
    {
        jobcenter: 'https://www.jobcenter-duisburg.de/',
        immigration: 'https://www.duisburg.de/auslaenderbehoerde',
        ukraineHelp: 'https://www.duisburg.de/ukraine',
        appointments: 'https://termine.duisburg.de/'
    }
);

// BOCHUM (Nordrhein-Westfalen)
export const BOCHUM_PACKAGE = createCityPackage(
    'Bochum',
    'BOC',
    'Nordrhein-Westfalen',
    {
        jobcenter: 'https://jobcenter-bochum.de/',
        immigration: 'https://www.bochum.de/Auslaenderbuero',
        ukraineHelp: 'https://www.bochum.de/Aktuelle-Pressemeldungen/Fragen-und-Antworten-zur-Ukraine-Krise',
        appointments: 'https://www.bochum.de/Online-Terminbuchung'
    }
);

// WUPPERTAL (Nordrhein-Westfalen)
export const WUPPERTAL_PACKAGE = createCityPackage(
    'Wuppertal',
    'WUP',
    'Nordrhein-Westfalen',
    {
        jobcenter: 'https://www.jobcenter-wuppertal.de/',
        immigration: 'https://www.wuppertal.de/auslaenderbehoerde',
        ukraineHelp: 'https://www.wuppertal.de/migration',
        appointments: 'https://termine.wuppertal.de/'
    }
);

// BIELEFELD (Nordrhein-Westfalen)
export const BIELEFELD_PACKAGE = createCityPackage(
    'Bielefeld',
    'BIE',
    'Nordrhein-Westfalen',
    {
        jobcenter: 'https://www.jobcenter-bielefeld.de/',
        immigration: 'https://www.bielefeld.de/auslaenderbehoerde',
        ukraineHelp: 'https://www.bielefeld.de/ukraine',
        appointments: 'https://termine.bielefeld.de/'
    }
);

// BONN (Nordrhein-Westfalen)
export const BONN_PACKAGE = createCityPackage(
    'Bonn',
    'BON',
    'Nordrhein-Westfalen',
    {
        jobcenter: 'https://www.jobcenter-bonn.de/',
        immigration: 'https://www.bonn.de/auslaenderamt',
        ukraineHelp: 'https://www.bonn.de/ukraine',
        appointments: 'https://termine.bonn.de/'
    }
);

// MÜNSTER (Nordrhein-Westfalen)
export const MUENSTER_PACKAGE = createCityPackage(
    'Münster',
    'MS',
    'Nordrhein-Westfalen',
    {
        jobcenter: 'https://www.jobcenter-muenster.de/',
        immigration: 'https://www.stadt-muenster.de/auslaenderamt',
        ukraineHelp: 'https://www.stadt-muenster.de/ukraine',
        appointments: 'https://termine.stadt-muenster.de/'
    }
);

// KARLSRUHE (Baden-Württemberg)
export const KARLSRUHE_PACKAGE = createCityPackage(
    'Karlsruhe',
    'KAE',
    'Baden-Württemberg',
    {
        jobcenter: 'https://www.jobcenter-stadt-karlsruhe.de/',
        immigration: 'https://www.karlsruhe.de/auslaenderbehoerde',
        ukraineHelp: 'https://www.karlsruhe.de/ukraine',
        appointments: 'https://termin.karlsruhe.de/'
    }
);

// MANNHEIM (Baden-Württemberg)
export const MANNHEIM_PACKAGE = createCityPackage(
    'Mannheim',
    'MA',
    'Baden-Württemberg',
    {
        jobcenter: 'https://www.jobcenter-mannheim.de/',
        immigration: 'https://www.mannheim.de/auslaenderbehoerde',
        ukraineHelp: 'https://www.mannheim.de/ukraine',
        appointments: 'https://termin.mannheim.de/'
    }
);

// AUGSBURG (Bayern)
export const AUGSBURG_PACKAGE = createCityPackage(
    'Augsburg',
    'AGB',
    'Bayern',
    {
        jobcenter: 'https://www.jobcenter-augsburg-stadt.de/',
        immigration: 'https://www.augsburg.de/buergerservice-rathaus/auslaenderbehoerde',
        ukraineHelp: 'https://www.augsburg.de/ukraine',
        appointments: 'https://termine.augsburg.de/'
    }
);

// POTSDAM (Brandenburg)
export const POTSDAM_PACKAGE = createCityPackage(
    'Potsdam',
    'POT',
    'Brandenburg',
    {
        jobcenter: 'https://jobcenter-potsdam.de/',
        immigration: 'https://www.potsdam.de/auslaenderbehoerde',
        ukraineHelp: 'https://www.potsdam.de/ukraine',
        appointments: 'https://termine.potsdam.de/'
    }
);

// SCHWERIN (Mecklenburg-Vorpommern)
export const SCHWERIN_PACKAGE = createCityPackage(
    'Schwerin',
    'SZW',
    'Mecklenburg-Vorpommern',
    {
        jobcenter: 'https://www.jobcenter-schwerin.de/',
        immigration: 'https://www.schwerin.de/auslaenderbehoerde',
        ukraineHelp: 'https://www.schwerin.de/ukraine',
        appointments: 'https://termin.schwerin.de/'
    }
);

// MAGDEBURG (Sachsen-Anhalt)
export const MAGDEBURG_PACKAGE = createCityPackage(
    'Magdeburg',
    'MD',
    'Sachsen-Anhalt',
    {
        jobcenter: 'https://www.jobcenter-magdeburg.de/',
        immigration: 'https://www.magdeburg.de/auslaenderbehoerde',
        ukraineHelp: 'https://www.magdeburg.de/ukraine',
        appointments: 'https://termine.magdeburg.de/'
    }
);

// KIEL (Schleswig-Holstein)
export const KIEL_PACKAGE = createCityPackage(
    'Kiel',
    'KEL',
    'Schleswig-Holstein',
    {
        jobcenter: 'https://www.jobcenter-kiel.de/',
        immigration: 'https://www.kiel.de/auslaenderbehoerde',
        ukraineHelp: 'https://www.kiel.de/ukraine',
        appointments: 'https://termin.kiel.de/'
    }
);

// WIESBADEN (Hessen)
export const WIESBADEN_PACKAGE = createCityPackage(
    'Wiesbaden',
    'WIE',
    'Hessen',
    {
        jobcenter: 'https://www.jobcenter-wiesbaden.de/',
        immigration: 'https://www.wiesbaden.de/auslaenderbehoerde',
        ukraineHelp: 'https://www.wiesbaden.de/ukraine',
        appointments: 'https://termin.wiesbaden.de/'
    }
);
