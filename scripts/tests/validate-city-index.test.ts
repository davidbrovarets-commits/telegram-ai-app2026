
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import * as CityPackages from '../city-packages'; // Dynamic import of all exports

// Load the index
const indexPath = path.resolve(__dirname, '../../scripts/city-packages.index.json');
const rawIndex = fs.readFileSync(indexPath, 'utf-8');
const index = JSON.parse(rawIndex);

/**
 * CITY INDEX VALIDATION
 * 
 * Ensures that:
 * 1. Every city in the index has a corresponding export in `city-packages.ts`.
 * 2. The exported package matches the index definition (package_id, city, land).
 * 3. Total count matches.
 */
describe('City Packages Index Validation', () => {

    // 1. Validate Structure of Index
    it('should have valid index structure', () => {
        expect(index).toHaveProperty('index_version');
        expect(index).toHaveProperty('total_cities');
        expect(index).toHaveProperty('packages');
        expect(index.packages.length).toBe(index.total_cities);
    });

    // 2. Validate Implementation vs Index
    index.packages.forEach((entry: any) => {
        it(`should have implemented package for ${entry.city} (${entry.city_code})`, () => {
            // Find the exported package from city-packages.ts
            // We search through all exports to find one where valid[0].geo.city === entry.city

            const exports = Object.values(CityPackages);
            const foundExport: any[] | undefined = exports.find((pkg: any) => {
                // Packages are arrays of SourceConfig
                if (!Array.isArray(pkg)) return false;
                const firstSource = pkg[0];
                return firstSource &&
                    firstSource.geo &&
                    firstSource.geo.city === entry.city &&
                    firstSource.geo.land === entry.land;
            }) as any[] | undefined;

            expect(foundExport).toBeDefined();

            // Check if package_id naming convention matches
            // The exported const name isn't available runtime easily, but we can check source_ids
            // Expectation: city_CODE_jobcenter, etc.

            if (foundExport) {
                // Validate Jobcenter
                const jobcenter = foundExport.find((s: any) => s.source_id.includes('_jobcenter'));
                expect(jobcenter).toBeDefined();
                expect(jobcenter.source_id).toContain(`city_${entry.city_code.toLowerCase()}_jobcenter`);
                expect(jobcenter.geo.city).toBe(entry.city);
                expect(jobcenter.geo.land).toBe(entry.land);

                // Validate Immigration (Ausländerbehörde)
                // Note: current naming convention in city-packages.ts might use _immigration or _status?
                // Looking at code: dedupe_group is `city_${code}_status` but source_id is `city_${code}_immigration`
                const immigration = foundExport.find((s: any) => s.source_id.includes('_immigration'));
                expect(immigration).toBeDefined();
                expect(immigration.source_id).toContain(`city_${entry.city_code.toLowerCase()}_immigration`);

                // Validate Ukraine Help
                const help = foundExport.find((s: any) => s.source_id.includes('_ukraine_help'));
                expect(help).toBeDefined();
                expect(help.source_id).toContain(`city_${entry.city_code.toLowerCase()}_ukraine_help`);

                // Validate Appointments
                const appt = foundExport.find((s: any) => s.source_id.includes('_appointments'));
                expect(appt).toBeDefined();
                expect(appt.source_id).toContain(`city_${entry.city_code.toLowerCase()}_appointments`);
            }
        });
    });

    // 3. Reverse Check: Are there implemented cities NOT in the index?
    it('should not have unindexed city packages', () => {
        const exports = Object.values(CityPackages);

        let implementedCityCount = 0;

        exports.forEach((pkg: any) => {
            // Check if it looks like a city package (array of sources with scope CITY)
            if (Array.isArray(pkg) && pkg.length > 0 && pkg[0].scope === 'CITY') {
                const city = pkg[0].geo.city;
                const land = pkg[0].geo.land;

                // Find in index
                const inIndex = index.packages.find((e: any) => e.city === city && e.land === land);

                if (!inIndex) {
                    console.error(`Found implementation for ${city} (${land}) but NOT in index!`);
                }
                expect(inIndex).toBeDefined();
                implementedCityCount++;
            }
        });

        expect(implementedCityCount).toBe(index.total_cities);
    });

});
