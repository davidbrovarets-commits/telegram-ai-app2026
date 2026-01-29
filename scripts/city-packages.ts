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
    'leipzig',
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
