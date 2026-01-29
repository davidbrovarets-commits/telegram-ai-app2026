/**
 * Feed Resolution Adapter
 * 
 * Implements the core feed resolution logic:
 * FEED(user) = DE + LAND(user.land) + CITY(user.city if exists)
 */

import { SOURCES, SourceConfig } from './config';

export interface UserGeo {
    country: 'DE';
    land: string;
    city?: string;
}

// City-states that should NOT have CITY packages
const CITY_STATES = ['Berlin', 'Hamburg', 'Bremen'];

/**
 * Resolves which feed sources should be shown to a user based on their geo location.
 * 
 * @param user - User's geo information
 * @returns Array of sources matching the user's geo scope
 */
export function resolveFeedSources(user: UserGeo): SourceConfig[] {
    const feed: SourceConfig[] = [];

    for (const source of SOURCES) {
        // Include all DE (federal) sources
        if (source.scope === 'DE') {
            feed.push(source);
            continue;
        }

        // Include LAND sources if user's land matches
        if (source.scope === 'LAND' && source.geo.land === user.land) {
            feed.push(source);
            continue;
        }

        // Include CITY sources only if:
        // 1. User has a city specified
        // 2. User's city is NOT a city-state
        // 3. Source city matches user's city exactly
        // 4. Source land matches user's land (safety check)
        if (
            source.scope === 'CITY' &&
            user.city &&
            !CITY_STATES.includes(user.city) &&
            source.geo.city === user.city &&
            source.geo.land === user.land
        ) {
            feed.push(source);
            continue;
        }
    }

    return feed;
}

/**
 * Checks if a city has an active CITY package
 */
export function hasCityPackage(city: string): boolean {
    return SOURCES.some(s => s.scope === 'CITY' && s.geo.city === city);
}
