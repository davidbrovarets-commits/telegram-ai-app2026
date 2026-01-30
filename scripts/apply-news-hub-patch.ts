/**
 * GENERATE NEWS_HUB CONFIGS — Creates NEWS_HUB source configs for all 33 cities
 * 
 * Run with: npx tsx scripts/apply-news-hub-patch.ts
 * 
 * Generates JSON configs that can be inspected and manually integrated.
 */

import citiesIndex from './city-packages.index.json';
import { generateCityNewsHub, type CityInfo } from './news-hub-template';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface CityPackageInfo {
    city: string;
    land: string;
    city_code: string;
    package_id: string;
    status: string;
}

/**
 * Generates NEWS_HUB config for a single city
 */
function generateCityConfig(cityInfo: CityPackageInfo): any {
    return generateCityNewsHub({
        name: cityInfo.city,
        code: cityInfo.city_code,
        land: cityInfo.land,
        package_id: cityInfo.package_id
    });
}

/**
 * Main execution
 */
async function main() {
    console.log('\n🔧 CITY_NEWS_HUB CONFIG GENERATOR v1\n');
    console.log('='.repeat(60));

    const cities = (citiesIndex.packages as CityPackageInfo[])
        .filter(c => c.status === 'active');

    console.log(`📊 Generating NEWS_HUB configs for ${cities.length} cities\n`);

    const allConfigs: Record<string, any> = {};

    for (const cityInfo of cities) {
        console.log(`  [${Object.keys(allConfigs).length + 1}/${cities.length}] ${cityInfo.city} (${cityInfo.city_code})`);

        const config = generateCityConfig(cityInfo);
        allConfigs[cityInfo.city_code] = config;
    }

    // Write to output file
    const outputPath = join(__dirname, 'generated-news-hub-configs.json');
    fs.writeFileSync(outputPath, JSON.stringify(allConfigs, null, 2), 'utf-8');

    console.log('\n' + '='.repeat(60));
    console.log(`\n✅ Generated ${Object.keys(allConfigs).length} NEWS_HUB configs`);
    console.log(`📁 Output: ${outputPath}\n`);

    // Generate TypeScript code snippet for manual integration
    console.log('📝 Next steps:\n');
    console.log('1. Review generated configs in generated-news-hub-configs.json');
    console.log('2. For each city package, append NEWS_HUB to sources array');
    console.log('3. Example for Leipzig:\n');

    const leipzigExample = allConfigs['LEJ'];
    console.log('```typescript');
    console.log('// In city-packages.ts, after existing 4 sources:');
    console.log(JSON.stringify(leipzigExample, null, 2).substring(0, 300));
    console.log('...');
    console.log('```\n');
}

// Run
main().catch(console.error);
