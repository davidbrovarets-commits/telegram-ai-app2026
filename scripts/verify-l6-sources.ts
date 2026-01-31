
import { SOURCES } from './config';

console.log('--- L6 SOURCE VERIFICATION ---');
console.log(`Total Sources: ${SOURCES.length}`);

const deSources = SOURCES.filter(s => s.scope === 'DE');
const landSources = SOURCES.filter(s => s.scope === 'LAND');
const citySources = SOURCES.filter(s => s.scope === 'CITY');

console.log(`DE Sources: ${deSources.length}`);
console.log(`LAND Sources: ${landSources.length}`);
console.log(`CITY Sources: ${citySources.length}`);

console.log('\n--- SANITY CHECKS ---');
const breg = SOURCES.find(s => s.source_id === 'breg_bundesregierung_news');
if (breg) {
    console.log('✅ Found Federal Source: breg_bundesregierung_news');
    console.log(`   Scope: ${breg.scope}`);
    console.log(`   Priority: ${breg.default_priority}`);
} else {
    console.log('❌ MISSING: breg_bundesregierung_news');
}

const swr = SOURCES.find(s => s.source_id === 'bw_swr');
if (swr) {
    console.log('✅ Found State Source: bw_swr');
    console.log(`   Scope: ${swr.scope}`);
    console.log(`   Land: ${swr.geo.land}`);
} else {
    console.log('❌ MISSING: bw_swr');
}

console.log('\n--- FIRST 5 SOURCES ---');
SOURCES.slice(0, 5).forEach(s => {
    console.log(`- [${s.scope}] ${s.source_id} (${s.base_url})`);
});

const leipzig = SOURCES.find(s => s.source_id === 'leipzig_official');
if (leipzig) {
    console.log('✅ Found City Source: leipzig_official');
    console.log(`   Scope: ${leipzig.scope}`);
    console.log(`   City: ${leipzig.geo.city}`);
    console.log(`   Land: ${leipzig.geo.land}`);
    console.log(`   Priority: ${leipzig.default_priority}`);
} else {
    console.log('❌ MISSING: leipzig_official');
}
